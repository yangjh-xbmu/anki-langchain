import React, { useState, useEffect } from 'react';
import axios from 'axios';

function WordPractice() {
  const [words, setWords] = useState([]);
  const [currentWord, setCurrentWord] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);

  useEffect(() => {
    fetchWords();
  }, []);

  const fetchWords = async () => {
    try {
      const response = await axios.get('/api/words');
      setWords(response.data);
      if (response.data.length > 0) {
        setCurrentWord(response.data[0]);
      }
    } catch (error) {
      console.error('获取单词失败:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentWord) return;

    const correct = userInput.toLowerCase().trim() === currentWord.word.toLowerCase();
    setIsCorrect(correct);
    
    if (correct) {
      setFeedback('正确！');
      // 延迟后显示下一个单词
      setTimeout(() => {
        nextWord();
      }, 1500);
    } else {
      setFeedback(`错误！正确答案是: ${currentWord.word}`);
    }
  };

  const nextWord = () => {
    const currentIndex = words.findIndex(w => w.id === currentWord.id);
    const nextIndex = (currentIndex + 1) % words.length;
    setCurrentWord(words[nextIndex]);
    setUserInput('');
    setFeedback('');
    setIsCorrect(null);
  };

  if (!currentWord) {
    return <div>加载中...</div>;
  }

  return (
    <div className="word-practice">
      <h2>单词练习</h2>
      
      {currentWord.image && (
        <div className="word-image">
          <img src={currentWord.image} alt="单词图片" style={{maxWidth: '200px', maxHeight: '200px'}} />
        </div>
      )}
      
      {currentWord.audio && (
        <div className="word-audio">
          <audio controls>
            <source src={currentWord.audio} type="audio/mpeg" />
            您的浏览器不支持音频播放。
          </audio>
        </div>
      )}
      
      <div className="word-hint">
        <p>请输入这个单词:</p>
        {currentWord.meaning && <p>提示: {currentWord.meaning}</p>}
      </div>
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          className="word-input"
          placeholder="输入单词..."
          disabled={isCorrect === true}
        />
        <button type="submit" className="submit-btn" disabled={isCorrect === true}>
          提交
        </button>
      </form>
      
      {feedback && (
        <div className={`feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
          {feedback}
        </div>
      )}
      
      {isCorrect === false && (
        <button onClick={nextWord} className="submit-btn" style={{marginTop: '10px'}}>
          下一个单词
        </button>
      )}
    </div>
  );
}

export default WordPractice;
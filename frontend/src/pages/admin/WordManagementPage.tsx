import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../components/layout/AdminLayout';
import PermissionGuard from '../../components/auth/PermissionGuard';

interface Word {
  id: string;
  word: string;
  definition: string;
  pronunciation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  examples: string[];
  createdAt: string;
  updatedAt: string;
  practiceCount: number;
  correctRate: number;
}

const WordManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    word: '',
    definition: '',
    pronunciation: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    category: '',
    examples: ['', '', '']
  });

  const categories = ['Technology', 'Business', 'Science', 'Daily Life', 'Academic'];
  const difficulties = ['easy', 'medium', 'hard'];

  // 模拟数据
  useEffect(() => {
    const mockWords: Word[] = [
      {
        id: '1',
        word: 'algorithm',
        definition: 'A process or set of rules to be followed in calculations or other problem-solving operations',
        pronunciation: '/ˈælɡərɪðəm/',
        difficulty: 'medium',
        category: 'Technology',
        examples: [
          'The sorting algorithm is very efficient.',
          'Machine learning algorithms can predict outcomes.',
          'This algorithm solves the problem in linear time.'
        ],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        practiceCount: 45,
        correctRate: 0.78
      },
      {
        id: '2',
        word: 'entrepreneur',
        definition: 'A person who organizes and operates a business or businesses',
        pronunciation: '/ˌɑntrəprəˈnɜr/',
        difficulty: 'hard',
        category: 'Business',
        examples: [
          'She is a successful entrepreneur.',
          'The entrepreneur launched three startups.',
          'Young entrepreneurs are changing the market.'
        ],
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        practiceCount: 23,
        correctRate: 0.65
      },
      {
        id: '3',
        word: 'photosynthesis',
        definition: 'The process by which green plants use sunlight to synthesize foods from carbon dioxide and water',
        pronunciation: '/ˌfoʊtoʊˈsɪnθəsɪs/',
        difficulty: 'hard',
        category: 'Science',
        examples: [
          'Photosynthesis occurs in plant leaves.',
          'Chlorophyll is essential for photosynthesis.',
          'The rate of photosynthesis depends on light intensity.'
        ],
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
        practiceCount: 67,
        correctRate: 0.82
      }
    ];

    setTimeout(() => {
      setWords(mockWords);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredWords = words.filter(word => {
    const matchesSearch = word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         word.definition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || word.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || word.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const handleCreateWord = () => {
    setSelectedWord(null);
    setFormData({
      word: '',
      definition: '',
      pronunciation: '',
      difficulty: 'medium',
      category: '',
      examples: ['', '', '']
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEditWord = (word: Word) => {
    setSelectedWord(word);
    setFormData({
      word: word.word,
      definition: word.definition,
      pronunciation: word.pronunciation,
      difficulty: word.difficulty,
      category: word.category,
      examples: word.examples.length >= 3 ? word.examples.slice(0, 3) : [...word.examples, ...Array(3 - word.examples.length).fill('')]
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDeleteWord = (wordId: string) => {
    if (confirm('确定要删除这个单词吗？')) {
      setWords(words.filter(word => word.id !== wordId));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const examples = formData.examples.filter(example => example.trim() !== '');
    
    if (isEditing && selectedWord) {
      // 更新单词
      setWords(words.map(word => 
        word.id === selectedWord.id 
          ? { 
              ...word, 
              ...formData, 
              examples,
              updatedAt: new Date().toISOString()
            }
          : word
      ));
    } else {
      // 创建新单词
      const newWord: Word = {
        id: Date.now().toString(),
        ...formData,
        examples,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        practiceCount: 0,
        correctRate: 0
      };
      setWords([...words, newWord]);
    }
    
    setIsModalOpen(false);
  };

  const handleExampleChange = (index: number, value: string) => {
    const newExamples = [...formData.examples];
    newExamples[index] = value;
    setFormData({ ...formData, examples: newExamples });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'badge-success';
      case 'medium': return 'badge-warning';
      case 'hard': return 'badge-error';
      default: return 'badge-neutral';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <PermissionGuard requiredPermissions={['word:read']}>
      <AdminLayout>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">单词管理</h1>
            <PermissionGuard requiredPermissions={['word:write']}>
              <button 
                onClick={handleCreateWord}
                className="btn btn-primary"
              >
                添加单词
              </button>
            </PermissionGuard>
          </div>

          {/* 筛选和搜索 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <input
              type="text"
              placeholder="搜索单词或定义..."
              className="input input-bordered"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <select
              className="select select-bordered"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">所有分类</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select
              className="select select-bordered"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
            >
              <option value="all">所有难度</option>
              {difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>
                  {difficulty === 'easy' ? '简单' : difficulty === 'medium' ? '中等' : '困难'}
                </option>
              ))}
            </select>
            
            <div className="text-sm text-gray-500 flex items-center">
              共 {filteredWords.length} 个单词
            </div>
          </div>

          {/* 单词列表 */}
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>单词</th>
                  <th>定义</th>
                  <th>发音</th>
                  <th>难度</th>
                  <th>分类</th>
                  <th>练习次数</th>
                  <th>正确率</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredWords.map((word) => (
                  <tr key={word.id}>
                    <td>
                      <div className="font-bold text-lg">{word.word}</div>
                    </td>
                    <td>
                      <div className="max-w-xs truncate" title={word.definition}>
                        {word.definition}
                      </div>
                    </td>
                    <td>
                      <code className="text-sm">{word.pronunciation}</code>
                    </td>
                    <td>
                      <div className={`badge ${getDifficultyColor(word.difficulty)}`}>
                        {word.difficulty === 'easy' ? '简单' : 
                         word.difficulty === 'medium' ? '中等' : '困难'}
                      </div>
                    </td>
                    <td>
                      <div className="badge badge-outline">{word.category}</div>
                    </td>
                    <td>
                      <div className="text-center">{word.practiceCount}</div>
                    </td>
                    <td>
                      <div className="text-center">
                        {(word.correctRate * 100).toFixed(1)}%
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <PermissionGuard requiredPermissions={['word:write']}>
                          <button
                            onClick={() => handleEditWord(word)}
                            className="btn btn-sm btn-outline"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDeleteWord(word.id)}
                            className="btn btn-sm btn-error btn-outline"
                          >
                            删除
                          </button>
                        </PermissionGuard>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 创建/编辑单词模态框 */}
          {isModalOpen && (
            <div className="modal modal-open">
              <div className="modal-box w-11/12 max-w-3xl">
                <h3 className="font-bold text-lg mb-4">
                  {isEditing ? '编辑单词' : '添加单词'}
                </h3>
                
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">单词</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        value={formData.word}
                        onChange={(e) => setFormData({...formData, word: e.target.value})}
                        required
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">发音</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        placeholder="/ˈeksəmpl/"
                        value={formData.pronunciation}
                        onChange={(e) => setFormData({...formData, pronunciation: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text">定义</span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered h-24"
                      value={formData.definition}
                      onChange={(e) => setFormData({...formData, definition: e.target.value})}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">难度</span>
                      </label>
                      <select
                        className="select select-bordered"
                        value={formData.difficulty}
                        onChange={(e) => setFormData({...formData, difficulty: e.target.value as 'easy' | 'medium' | 'hard'})}
                      >
                        <option value="easy">简单</option>
                        <option value="medium">中等</option>
                        <option value="hard">困难</option>
                      </select>
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">分类</span>
                      </label>
                      <select
                        className="select select-bordered"
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        required
                      >
                        <option value="">选择分类</option>
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-control mb-6">
                    <label className="label">
                      <span className="label-text">例句</span>
                    </label>
                    {formData.examples.map((example, index) => (
                      <input
                        key={index}
                        type="text"
                        className="input input-bordered mb-2"
                        placeholder={`例句 ${index + 1}`}
                        value={example}
                        onChange={(e) => handleExampleChange(index, e.target.value)}
                      />
                    ))}
                  </div>

                  <div className="modal-action">
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setIsModalOpen(false)}
                    >
                      取消
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {isEditing ? '更新' : '添加'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </PermissionGuard>
  );
};

export default WordManagementPage;
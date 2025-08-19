import { useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminRoutes from '../../src/routes/AdminRoutes';

export default function AdminIndex() {
  const router = useRouter();

  useEffect(() => {
    // 重定向到admin登录页面
    router.replace('/admin/login');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">正在跳转到管理面板...</div>
    </div>
  );
}
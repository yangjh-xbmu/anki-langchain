import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../components/layout/AdminLayout';
import PermissionGuard from '../../components/auth/PermissionGuard';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  createdAt: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
}

const RoleManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  // 模拟数据
  useEffect(() => {
    const mockRoles: Role[] = [
      {
        id: '1',
        name: 'superadmin',
        description: '超级管理员，拥有所有权限',
        permissions: ['user:read', 'user:write', 'role:read', 'role:write', 'permission:read', 'permission:write'],
        userCount: 1,
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        name: 'admin',
        description: '管理员，拥有大部分管理权限',
        permissions: ['user:read', 'user:write', 'role:read', 'word:read', 'word:write'],
        userCount: 3,
        createdAt: '2024-01-02T00:00:00Z'
      },
      {
        id: '3',
        name: 'user',
        description: '普通用户，基础权限',
        permissions: ['word:read'],
        userCount: 150,
        createdAt: '2024-01-03T00:00:00Z'
      }
    ];

    const mockPermissions: Permission[] = [
      { id: '1', name: 'user:read', description: '查看用户信息' },
      { id: '2', name: 'user:write', description: '编辑用户信息' },
      { id: '3', name: 'role:read', description: '查看角色信息' },
      { id: '4', name: 'role:write', description: '编辑角色信息' },
      { id: '5', name: 'permission:read', description: '查看权限信息' },
      { id: '6', name: 'permission:write', description: '编辑权限信息' },
      { id: '7', name: 'word:read', description: '查看单词数据' },
      { id: '8', name: 'word:write', description: '编辑单词数据' }
    ];

    setTimeout(() => {
      setRoles(mockRoles);
      setPermissions(mockPermissions);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateRole = () => {
    setSelectedRole(null);
    setFormData({ name: '', description: '', permissions: [] });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDeleteRole = (roleId: string) => {
    if (confirm('确定要删除这个角色吗？')) {
      setRoles(roles.filter(role => role.id !== roleId));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing && selectedRole) {
      // 更新角色
      setRoles(roles.map(role => 
        role.id === selectedRole.id 
          ? { ...role, ...formData }
          : role
      ));
    } else {
      // 创建新角色
      const newRole: Role = {
        id: Date.now().toString(),
        ...formData,
        userCount: 0,
        createdAt: new Date().toISOString()
      };
      setRoles([...roles, newRole]);
    }
    
    setIsModalOpen(false);
  };

  const handlePermissionToggle = (permissionName: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionName)
        ? prev.permissions.filter(p => p !== permissionName)
        : [...prev.permissions, permissionName]
    }));
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
    <PermissionGuard requiredPermissions={['role:read']}>
      <AdminLayout>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">角色管理</h1>
            <PermissionGuard requiredPermissions={['role:write']}>
              <button 
                onClick={handleCreateRole}
                className="btn btn-primary"
              >
                创建角色
              </button>
            </PermissionGuard>
          </div>

          {/* 搜索栏 */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="搜索角色..."
              className="input input-bordered w-full max-w-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* 角色列表 */}
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>角色名称</th>
                  <th>描述</th>
                  <th>权限数量</th>
                  <th>用户数量</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map((role) => (
                  <tr key={role.id}>
                    <td>
                      <div className="font-bold">{role.name}</div>
                    </td>
                    <td>{role.description}</td>
                    <td>
                      <div className="badge badge-info">
                        {role.permissions.length}
                      </div>
                    </td>
                    <td>
                      <div className="badge badge-success">
                        {role.userCount}
                      </div>
                    </td>
                    <td>{new Date(role.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="flex gap-2">
                        <PermissionGuard requiredPermissions={['role:write']}>
                          <button
                            onClick={() => handleEditRole(role)}
                            className="btn btn-sm btn-outline"
                          >
                            编辑
                          </button>
                          {role.name !== 'superadmin' && (
                            <button
                              onClick={() => handleDeleteRole(role.id)}
                              className="btn btn-sm btn-error btn-outline"
                            >
                              删除
                            </button>
                          )}
                        </PermissionGuard>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 创建/编辑角色模态框 */}
          {isModalOpen && (
            <div className="modal modal-open">
              <div className="modal-box w-11/12 max-w-2xl">
                <h3 className="font-bold text-lg mb-4">
                  {isEditing ? '编辑角色' : '创建角色'}
                </h3>
                
                <form onSubmit={handleSubmit}>
                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text">角色名称</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text">描述</span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-control mb-6">
                    <label className="label">
                      <span className="label-text">权限</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                      {permissions.map((permission) => (
                        <label key={permission.id} className="cursor-pointer label">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-primary"
                            checked={formData.permissions.includes(permission.name)}
                            onChange={() => handlePermissionToggle(permission.name)}
                          />
                          <span className="label-text ml-2">
                            <div className="font-medium">{permission.name}</div>
                            <div className="text-sm text-gray-500">{permission.description}</div>
                          </span>
                        </label>
                      ))}
                    </div>
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
                      {isEditing ? '更新' : '创建'}
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

export default RoleManagementPage;
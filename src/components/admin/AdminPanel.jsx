import React, { useState } from 'react';
import { ArrowLeft, PlusCircle, Trash2, Users } from 'lucide-react';
import { BrandLogo } from '../branding/BrandLogo';
import { apiFetch, saveCollectionItem } from '../../lib/api';
import { useData } from '../../hooks/useData';

const AdminPanel = ({ onBack }) => {
  const { data: users } = useData('users');
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'EQUIPE_ENERGIE',
  });
  const [loading, setLoading] = useState(false);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) return;

    setLoading(true);
    await saveCollectionItem('users', newUser);
    setNewUser({ username: '', password: '', role: 'EQUIPE_ENERGIE' });
    setLoading(false);
  };

  const handleDeleteUser = async (id) => {
    const ok = window.confirm(
      "Voulez-vous vraiment supprimer cet utilisateur ?"
    );
    if (!ok) return;

    try {
      await apiFetch(`/api/data/users/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      alert(error.message || "Erreur lors de la suppression de l'utilisateur");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <header className="max-w-4xl mx-auto mb-8 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 p-2 bg-white rounded-full shadow hover:bg-slate-50"
          >
            <ArrowLeft size={20} />
          </button>
          <BrandLogo size="h-8" />
          <h1 className="text-2xl font-black text-slate-800 ml-4">
            Administration
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
          <h2 className="font-bold text-lg mb-4 flex items-center text-blue-900">
            <PlusCircle className="mr-2" /> Ajouter Utilisateur
          </h2>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Nom d&apos;utilisateur
              </label>
              <input
                type="text"
                value={newUser.username}
                onChange={(e) =>
                  setNewUser({ ...newUser, username: e.target.value })
                }
                className="w-full border p-2 rounded"
                placeholder="ex: Maintenance"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Mot de passe
              </label>
              <input
                type="text"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                className="w-full border p-2 rounded"
                placeholder="******"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Rôle
              </label>
              <select
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value })
                }
                className="w-full border p-2 rounded bg-white font-bold text-slate-700"
              >
                <option value="ADMIN">Administrateur (Accès Total)</option>
                <option value="EQUIPE_ENERGIE">
                  Équipe Énergie (Saisie)
                </option>
                <option value="DIRECTION">
                  Direction (Visuel Uniquement)
                </option>
              </select>
            </div>
            <button
              disabled={loading}
              className="w-full bg-blue-900 text-white py-2 rounded font-bold hover:bg-blue-800"
            >
              {loading ? '...' : 'Ajouter au PC'}
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="font-bold text-lg mb-4 flex items-center text-slate-700">
            <Users className="mr-2" /> Liste Utilisateurs PC ({users.length})
          </h2>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {users.map((u) => (
              <div
                key={u._id || u.id}
                className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50 group"
              >
                <div>
                  <div className="font-bold">{u.username}</div>
                  <div
                    className={`text-[10px] px-2 py-0.5 rounded w-fit uppercase font-bold ${
                      u.role === 'ADMIN'
                        ? 'bg-red-100 text-red-700'
                        : u.role === 'DIRECTION'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {u.role === 'ADMIN'
                      ? 'Admin'
                      : u.role === 'DIRECTION'
                      ? 'Direction'
                      : 'Équipe'}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteUser(u.id)}
                  className="p-2 rounded transition-all flex items-center text-slate-300 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;

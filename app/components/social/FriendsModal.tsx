import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { User, generateFriendCode, addFriendByCode, removeFriend, getFriendsData, getUser } from '~/lib/storage';

interface FriendsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User;
    onFriendsUpdated: () => void; // Callback to refresh data in parent
}

export function FriendsModal({ isOpen, onClose, currentUser, onFriendsUpdated }: FriendsModalProps) {
    const [friendCode, setFriendCode] = useState<string>(currentUser.friendCode || '');
    const [inputCode, setInputCode] = useState('');
    const [friendsList, setFriendsList] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Generate code if missing
    useEffect(() => {
        if (isOpen && !friendCode && currentUser.id) {
            generateFriendCode(currentUser.id)
                .then(code => setFriendCode(code))
                .catch(console.error);
        }
    }, [isOpen, currentUser]);

    // Load friends list
    useEffect(() => {
        if (isOpen && currentUser.friends && currentUser.friends.length > 0) {
            loadFriends();
        } else {
            setFriendsList([]);
        }
    }, [isOpen, currentUser.friends]);

    const loadFriends = async () => {
        setLoading(true);
        try {
            if (currentUser.friends && currentUser.friends.length > 0) {
                const friends = await getFriendsData(currentUser.friends);
                setFriendsList(friends);
            } else {
                setFriendsList([]);
            }
        } catch (err) {
            console.error("Error loading friends:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddFriend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputCode) return;

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await addFriendByCode(currentUser.id, inputCode.toUpperCase());
            setSuccess('¡Amigo agregado exitosamente!');
            setInputCode('');
            onFriendsUpdated(); // Refresh parent data
            // Reload local list
            // We need to fetch the updated user to get the new friends array
            // For now, let's just reload the list after a small delay or rely on onFriendsUpdated to trigger a re-render if parent updates currentUser
            // Actually, onFriendsUpdated should trigger a re-fetch of currentUser in parent, which updates props here.
        } catch (err: any) {
            setError(err.message || 'Error al agregar amigo');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFriend = async (friendId: string) => {
        if (!confirm("¿Seguro que quieres eliminar a este amigo?")) return;

        setLoading(true);
        try {
            await removeFriend(currentUser.id, friendId);
            onFriendsUpdated();
        } catch (err: any) {
            setError(err.message || 'Error al eliminar amigo');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(friendCode);
        setSuccess('¡Código copiado!');
        setTimeout(() => setSuccess(''), 2000);
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            overlayClassName="fixed inset-0 bg-black bg-opacity-80 z-40 backdrop-blur-sm"
            ariaHideApp={false}
        >
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-zinc-700 max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-zinc-700 flex justify-between items-center bg-gray-50 dark:bg-zinc-900/50">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        👥 Amigos y Competencia
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 text-2xl leading-none">&times;</button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {/* Section: My Code */}
                    <div className="mb-8 text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/50">
                        <p className="text-sm text-gray-600 dark:text-blue-200 mb-2 font-medium">TU CÓDIGO DE AMIGO</p>
                        <div
                            className="text-4xl font-mono font-bold text-blue-600 dark:text-blue-400 tracking-widest cursor-pointer hover:scale-105 transition-transform"
                            onClick={copyToClipboard}
                            title="Click para copiar"
                        >
                            {friendCode || '...'}
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Comparte este código para que te agreguen</p>
                    </div>

                    {/* Section: Add Friend */}
                    <div className="mb-8">
                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase mb-3 tracking-wide">Agregar Amigo</h4>
                        <form onSubmit={handleAddFriend} className="flex gap-2">
                            <input
                                type="text"
                                value={inputCode}
                                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                                placeholder="Ingresa código (ej: A1B2C3)"
                                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 dark:text-white uppercase font-mono placeholder-gray-400 dark:placeholder-zinc-600"
                                maxLength={6}
                            />
                            <button
                                type="submit"
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!inputCode || loading}
                            >
                                {loading ? '...' : '+'}
                            </button>
                        </form>
                        {error && <p className="text-red-500 text-sm mt-2 flex items-center gap-1">⚠️ {error}</p>}
                        {success && <p className="text-green-500 text-sm mt-2 flex items-center gap-1">✅ {success}</p>}
                    </div>

                    {/* Section: Friends List */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase mb-3 tracking-wide">Tus Amigos ({friendsList.length})</h4>
                        {friendsList.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 dark:text-zinc-500 italic border border-dashed border-gray-300 dark:border-zinc-700 rounded-lg">
                                No tienes amigos agregados aún.
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {friendsList.map(friend => (
                                    <li key={friend.id} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-700/50 rounded-lg border border-gray-100 dark:border-zinc-700 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
                                                style={{ backgroundColor: friend.color }}
                                            >
                                                {friend.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800 dark:text-gray-200">{friend.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Nivel {Math.floor((friend.weight?.length || 0) / 10) + 1}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveFriend(friend.id)}
                                            className="text-gray-400 hover:text-red-500 p-2 transition-colors"
                                            title="Eliminar amigo"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
}

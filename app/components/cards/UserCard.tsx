import { User } from '~/lib/storage';

interface UserCardProps {
  user: User;
  onClick: (user: User) => void;
  isSelected?: boolean;
}

export function UserCard({ user, onClick, isSelected = false }: UserCardProps) {
  return (
    <button
      onClick={() => onClick(user)}
      className={`bg-white dark:bg-zinc-800 p-4 rounded-2xl shadow-lg flex flex-col items-center transition-transform hover:scale-105 w-full ${
        isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
      }`}
      style={{ borderLeft: `4px solid ${user.color}` }}
    >
      <div 
        className="w-16 h-16 rounded-full mb-3 flex items-center justify-center text-2xl font-bold"
        style={{ backgroundColor: user.color }}
      >
        {user.avatar || user.name.charAt(0).toUpperCase()}
      </div>
      
      <h3 className="text-lg font-bold">{user.name}</h3>
      
      {user.weight && user.weight.length > 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {user.weight[user.weight.length - 1]} kg
        </p>
      )}
    </button>
  );
}

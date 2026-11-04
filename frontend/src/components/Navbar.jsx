import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { GraduationCap, LogOut } from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-blue-600">
                <GraduationCap size={28} />
                <span>BlockCred</span>
            </Link>

            <div className="flex items-center gap-6">
                <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium">Verify Document</Link>
                
                {user ? (
                    <>
                        <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium">Dashboard</Link>
                        <button 
                            onClick={handleLogout}
                            className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition"
                        >
                            <LogOut size={18} />
                            Logout
                        </button>
                    </>
                ) : (
                    <Link 
                        to="/login" 
                        className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                        Institution Login
                    </Link>
                )}
            </div>
        </nav>
    );
}
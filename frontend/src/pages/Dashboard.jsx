import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { UploadCloud, FileText, CheckCircle, Trash2 } from 'lucide-react';

export default function Dashboard() {
    const { user } = useContext(AuthContext);

    // Issuance State
    const [formData, setFormData] = useState({ studentEmail: '', credentialId: '', privateKey: '' });
    const [file, setFile] = useState(null);
    const [isIssuing, setIsIssuing] = useState(false);
    const [txHash, setTxHash] = useState(null);

    // Revocation State
    const [revokeData, setRevokeData] = useState({ credentialId: '', privateKey: '' });
    const [isRevoking, setIsRevoking] = useState(false);

    const [history, setHistory] = useState([]);

    const fetchHistory = async () => {
        try {
            const response = await api.get('/credentials/history');
            setHistory(response.data);
        } catch (error) { console.error(error); }
    };

    useEffect(() => { fetchHistory(); }, []);

    const handleIssueCredential = async (e) => {
        e.preventDefault();
        if (!file) return toast.error('Please select a PDF certificate to upload.');
        setIsIssuing(true);
        setTxHash(null);

        const payload = new FormData();
        payload.append('studentEmail', formData.studentEmail);
        payload.append('credentialId', formData.credentialId);
        payload.append('institutionPrivateKey', formData.privateKey);
        payload.append('certificate', file);

        try {
            const response = await api.post('/credentials/issue', payload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Credential issued on the blockchain!');
            setTxHash(response.data.transactionHash);
            setFormData({ studentEmail: '', credentialId: '', privateKey: '' });
            setFile(null);
            e.target.reset();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to issue credential.');
        } finally {
            setIsIssuing(false);
        }
    };

    const handleRevokeCredential = async (e) => {
        e.preventDefault();
        setIsRevoking(true);
        try {
            await api.post('/credentials/revoke', {
                credentialId: revokeData.credentialId,
                institutionPrivateKey: revokeData.privateKey
            });
            toast.success(`Credential ${revokeData.credentialId} has been securely revoked.`);
            setRevokeData({ credentialId: '', privateKey: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to revoke credential.');
        } finally {
            setIsRevoking(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 mt-8 space-y-8">

            {/* ISSUE CREDENTIAL SECTION */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100">
                    <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                        <UploadCloud size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Issue Credential</h1>
                        <p className="text-gray-500">Anchor a new academic certificate to the blockchain.</p>
                    </div>
                </div>

                <form onSubmit={handleIssueCredential} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Student Email</label>
                            <input
                                type="email" required
                                value={formData.studentEmail} onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="student@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Credential ID (Unique)</label>
                            <input
                                type="text" required
                                value={formData.credentialId} onChange={(e) => setFormData({ ...formData, credentialId: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. CERT-001"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Institution Private Key</label>
                        <input
                            type="password" required
                            value={formData.privateKey} onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Document (PDF)</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50">
                            <div className="space-y-1 text-center">
                                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-600 justify-center mt-2">
                                    <label className="relative cursor-pointer bg-transparent rounded-md font-medium text-blue-600 hover:text-blue-500">
                                        <span>Upload a file</span>
                                        <input type="file" accept=".pdf" className="sr-only" onChange={(e) => setFile(e.target.files[0])} required />
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500">{file ? file.name : "PDF up to 10MB"}</p>
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={isIssuing} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-70">
                        {isIssuing ? 'Processing on Blockchain...' : 'Issue Credential'}
                    </button>
                </form>

                {txHash && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 text-green-800">
                        <CheckCircle className="shrink-0 mt-0.5" size={20} />
                        <div>
                            <h4 className="font-semibold">Success!</h4>
                            <p className="text-sm mt-1">Transaction Hash: <span className="font-mono text-xs break-all">{txHash}</span></p>
                        </div>
                    </div>
                )}
            </div>

            {/* REVOKE CREDENTIAL SECTION */}
            <div className="bg-white rounded-xl shadow-sm border border-red-100 p-8">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                    <div className="bg-red-100 p-3 rounded-lg text-red-600">
                        <Trash2 size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Revoke Credential</h2>
                        <p className="text-gray-500 text-sm">Permanently invalidate an issued certificate on the blockchain.</p>
                    </div>
                </div>

                <form onSubmit={handleRevokeCredential} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Credential ID to Revoke</label>
                            <input
                                type="text" required
                                value={revokeData.credentialId} onChange={(e) => setRevokeData({ ...revokeData, credentialId: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Institution Private Key</label>
                            <input
                                type="password" required
                                value={revokeData.privateKey} onChange={(e) => setRevokeData({ ...revokeData, privateKey: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                            />
                        </div>
                    </div>
                    <button type="submit" disabled={isRevoking} className="w-full bg-red-600 text-white font-semibold py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-70">
                        {isRevoking ? 'Revoking on Blockchain...' : 'Revoke Credential'}
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mt-8">
                <h2 className="text-xl font-bold mb-4">Audit Trail</h2>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="p-4 border-b">Credential ID</th>
                            <th className="p-4 border-b">Email</th>
                            <th className="p-4 border-b">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map((cred) => (
                            <tr key={cred._id}>
                                <td className="p-4 border-b font-semibold">{cred.credentialId}</td>
                                <td className="p-4 border-b">{cred.studentEmail}</td>
                                <td className="p-4 border-b font-bold">{cred.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
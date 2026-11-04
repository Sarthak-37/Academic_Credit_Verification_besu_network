import { useState } from 'react';
import api from '../services/api';
import { ShieldCheck, XCircle, FileSearch, Info } from 'lucide-react';

export default function Verify() {
    const [credentialId, setCredentialId] = useState('');
    const [file, setFile] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [result, setResult] = useState(null);

    const handleVerify = async (e) => {
        e.preventDefault();
        if (!file) return;

        setIsVerifying(true);
        setResult(null);

        const payload = new FormData();
        payload.append('credentialId', credentialId);
        payload.append('certificate', file);

        try {
            const response = await api.post('/credentials/verify', payload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResult(response.data);
        } catch (error) {
            setResult({
                status: 'ERROR',
                message: error.response?.data?.message || 'Failed to connect to verification server.'
            });
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6 mt-12">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Verify Academic Credentials</h1>
                <p className="text-lg text-gray-600">Upload a PDF document to verify its cryptographic signature on the Hyperledger Besu blockchain.</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-8">
                <form onSubmit={handleVerify} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Credential ID</label>
                        <input 
                            type="text" required
                            value={credentialId} onChange={(e) => setCredentialId(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Enter the unique credential ID (e.g. CERT-001)"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Upload Document to Verify</label>
                        <input 
                            type="file" accept=".pdf" required
                            onChange={(e) => setFile(e.target.files[0])}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    </div>

                    <button 
                        type="submit" disabled={isVerifying || !file || !credentialId}
                        className="w-full bg-slate-800 text-white font-semibold py-3 rounded-lg hover:bg-slate-900 transition disabled:opacity-70 flex justify-center items-center gap-2"
                    >
                        <FileSearch size={20} />
                        {isVerifying ? 'Verifying against Blockchain...' : 'Verify Document'}
                    </button>
                </form>

                {result && (
                    <div className={`mt-8 p-6 rounded-lg border-2 ${
                        result.status === 'VALID' ? 'bg-green-50 border-green-500 text-green-900' :
                        result.status === 'INVALID' || result.status === 'REVOKED' ? 'bg-red-50 border-red-500 text-red-900' :
                        'bg-yellow-50 border-yellow-500 text-yellow-900'
                    }`}>
                        <div className="flex items-center gap-3 mb-2">
                            {result.status === 'VALID' ? <ShieldCheck size={28} className="text-green-600"/> :
                             result.status === 'INVALID' || result.status === 'REVOKED' ? <XCircle size={28} className="text-red-600"/> :
                             <Info size={28} className="text-yellow-600"/>}
                            <h3 className="text-xl font-bold">{result.status}</h3>
                        </div>
                        <p className="text-lg">{result.message}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
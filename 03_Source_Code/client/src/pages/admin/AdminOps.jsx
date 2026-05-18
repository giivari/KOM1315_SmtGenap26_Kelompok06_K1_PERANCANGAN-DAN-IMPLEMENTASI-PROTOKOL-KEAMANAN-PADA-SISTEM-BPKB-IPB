import { useState, useEffect } from 'react';
import { operationsAPI } from '../../services/api';

export default function AdminOps() {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchOperations();
  }, []);

  const fetchOperations = async () => {
    setLoading(true);
    try {
      const res = await operationsAPI.getAll();
      setOperations(res.data);
    } catch (error) {
      console.error('Failed to fetch operations');
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (index, value) => {
    const newOps = [...operations];
    newOps[index].value = value;
    setOperations(newOps);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      // The API expects an array of { category, value }
      const updates = operations.map(op => ({ category: op.category, value: op.value }));
      await operationsAPI.update(updates);
      setMessage('Data operasi berhasil diperbarui!');
      setTimeout(() => setMessage(''), 3000);
      fetchOperations();
    } catch (error) {
      alert('Gagal menyimpan data operasi');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && operations.length === 0) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Kelola Operasi Kampus (Green Campus)</h1>
        <p>Update data pencapaian kampus hijau</p>
      </div>

      <div className="card" style={{padding: '32px', maxWidth: '800px'}}>
        {message && <div className="alert alert-success">{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="table-container mb-32">
            <table className="table">
              <thead>
                <tr>
                  <th>Kategori</th>
                  <th>Nilai Maksimal</th>
                  <th>Nilai Saat Ini</th>
                </tr>
              </thead>
              <tbody>
                {operations.map((op, index) => (
                  <tr key={op.id}>
                    <td style={{fontWeight: '600'}}>{op.category}</td>
                    <td>{op.maxValue}</td>
                    <td>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={op.value} 
                        onChange={(e) => handleValueChange(index, e.target.value)}
                        min="0"
                        max={op.maxValue}
                        required
                        style={{width: '120px'}}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{display: 'flex', justifyContent: 'flex-end'}}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

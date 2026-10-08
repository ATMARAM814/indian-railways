import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getSuperAdminTiAssessmentStats } from '../../api/dashboardApi';
import { ArrowLeft, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';
import '../../styles/assessments.css';

const TiApprovalsPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getSuperAdminTiAssessmentStats();
            if (res.success) {
                setData(res.data || []);
            } else {
                throw new Error(res.message || 'Failed to fetch TI assessment stats');
            }
        } catch (err) {
            console.error(err);
            setError(err.message || 'Error fetching TI assessment stats');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <LoadingState cardsCount={1} />
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="dashboard-content">
                    <ErrorState message={error} onRetry={fetchData} />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Header Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'none',
                            border: 'none',
                            color: '#64748B',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            alignSelf: 'flex-start'
                        }}
                    >
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>

                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0B2341', marginBottom: '4px' }}>
                            TI-Wise Assessment Overview
                        </h1>
                        <p style={{ fontSize: '14px', color: '#64748B' }}>
                            Summary of employee assessment statuses broken down by Traffic Inspector.
                        </p>
                    </div>
                </div>

                {/* Data Table */}
                <div style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: 'var(--shadow-sm)',
                    overflow: 'hidden'
                }}>
                    {data.length === 0 ? (
                        <div style={{ padding: '48px 24px', textAlign: 'center', color: '#64748B' }}>
                            <p style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>No Data Available</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="workforce-table" style={{ fontSize: '14px', width: '100%' }}>
                                <thead>
                                    <tr style={{ verticalAlign: 'middle', textAlign: 'center', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                        <th style={{ verticalAlign: 'middle', textAlign: 'left', padding: '12px 16px', color: '#475569', fontWeight: 700 }}>Traffic Inspector</th>
                                        <th style={{ verticalAlign: 'middle', textAlign: 'center', padding: '12px 16px', color: '#475569', fontWeight: 700 }}>HRMS ID</th>
                                        <th style={{ verticalAlign: 'middle', textAlign: 'center', padding: '12px 16px', color: '#475569', fontWeight: 700 }}>Total Employees</th>
                                        <th style={{ verticalAlign: 'middle', textAlign: 'center', padding: '12px 16px', color: '#475569', fontWeight: 700 }}>Completed</th>
                                        <th style={{ verticalAlign: 'middle', textAlign: 'center', padding: '12px 16px', color: '#475569', fontWeight: 700 }}>Evaluation Pending</th>
                                        <th style={{ verticalAlign: 'middle', textAlign: 'center', padding: '12px 16px', color: '#475569', fontWeight: 700 }}>Approval Pending</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((row) => (
                                        <tr key={row.tiId} className="hover-row" style={{ borderBottom: '1px solid #E2E8F0' }}>
                                            <td style={{ verticalAlign: 'middle', textAlign: 'left', fontWeight: '600', padding: '12px 16px', color: '#0F172A' }}>
                                                {row.tiName}
                                            </td>
                                            <td style={{ verticalAlign: 'middle', textAlign: 'center', padding: '12px 16px', color: '#64748B' }}>
                                                {row.tiHrmsId}
                                            </td>
                                            <td style={{ verticalAlign: 'middle', textAlign: 'center', padding: '12px 16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 600, color: '#334155' }}>
                                                    <Users size={16} />
                                                    {row.totalEmployees}
                                                </div>
                                            </td>
                                            <td style={{ verticalAlign: 'middle', textAlign: 'center', padding: '12px 16px', fontWeight: '700', color: '#16A34A' }}>
                                                {row.completedAssessments}
                                            </td>
                                            <td style={{ verticalAlign: 'middle', textAlign: 'center', padding: '12px 16px', fontWeight: '700', color: '#D97706' }}>
                                                {row.pendingAssessments}
                                            </td>
                                            <td style={{ verticalAlign: 'middle', textAlign: 'center', padding: '12px 16px', fontWeight: '700', color: '#DC2626' }}>
                                                {row.approvalPending}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default TiApprovalsPage;

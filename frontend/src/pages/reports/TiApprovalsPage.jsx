import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getSuperAdminTiAssessmentStats } from '../../api/dashboardApi';
import { 
  ArrowLeft, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Compass, 
  X,
  Layers
} from 'lucide-react';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';
import '../../styles/assessments.css';

const TiApprovalsPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

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

    // Calculate overall division totals
    const totals = useMemo(() => {
        return data.reduce((acc, curr) => {
            acc.totalStaff += Number(curr.totalEmployees) || 0;
            acc.completed += Number(curr.completedAssessments) || 0;
            acc.evalPending += Number(curr.pendingAssessments) || 0;
            acc.approvalPending += Number(curr.approvalPending) || 0;
            return acc;
        }, { totalStaff: 0, completed: 0, evalPending: 0, approvalPending: 0 });
    }, [data]);

    // Filter by search query
    const filteredData = useMemo(() => {
        if (!searchQuery.trim()) return data;
        const q = searchQuery.toLowerCase();
        return data.filter(row => 
            (row.tiName && row.tiName.toLowerCase().includes(q)) ||
            (row.tiHrmsId && row.tiHrmsId.toLowerCase().includes(q)) ||
            (row.stationName && row.stationName.toLowerCase().includes(q)) ||
            (row.stationCode && row.stationCode.toLowerCase().includes(q))
        );
    }, [data, searchQuery]);

    const getInitials = (name) => {
        if (!name) return 'TI';
        return name
            .split(' ')
            .filter(Boolean)
            .map(part => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
    };

    if (loading) {
        return (
            <DashboardLayout>
                <LoadingState cardsCount={4} />
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="dashboard-content" style={{ padding: '24px' }}>
                    <ErrorState message={error} onRetry={fetchData} />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1440px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

                {/* Navigation & Header */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'none',
                            border: 'none',
                            color: '#64748B',
                            fontSize: '13.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            alignSelf: 'flex-start',
                            padding: '4px 0',
                            transition: 'color 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#1E293B'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#64748B'}
                    >
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>

                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                            TI-Wise Assessment Overview
                        </h1>
                        <p style={{ fontSize: '14px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                            Jurisdiction-level breakdown of staff evaluations, pending assessments, and approval workflows across Traffic Inspectors.
                        </p>
                    </div>
                </div>

                {/* Summary KPI Cards Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                    gap: '16px'
                }}>
                    {/* Card 1: Total TIs */}
                    <div style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #D7E3EF',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 1px 3px rgba(11, 35, 65, 0.04)'
                    }}>
                        <div>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                                Total Traffic Inspectors
                            </span>
                            <span style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
                                {data.length}
                            </span>
                        </div>
                        <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            backgroundColor: '#EFF6FF',
                            color: '#2563EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Compass size={20} />
                        </div>
                    </div>

                    {/* Card 2: Total Monitored Workforce */}
                    <div onClick={() => navigate('/reports')} title="Click to view all monitored crew in Reports" style={{ cursor: 'pointer',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #D7E3EF',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 1px 3px rgba(11, 35, 65, 0.04)'
                    }}>
                        <div>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                                Total Monitored Crew
                            </span>
                            <span style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
                                {totals.totalStaff}
                            </span>
                        </div>
                        <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            backgroundColor: '#F1F5F9',
                            color: '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Users size={20} />
                        </div>
                    </div>

                    {/* Card 3: Completed */}
                    <div onClick={() => navigate('/reports?assessmentStatus=completed')} title="Click to view completed evaluations in Reports" style={{ cursor: 'pointer',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #D7E3EF',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 1px 3px rgba(11, 35, 65, 0.04)'
                    }}>
                        <div>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                                Completed Evaluations
                            </span>
                            <span style={{ fontSize: '22px', fontWeight: 800, color: '#16A34A' }}>
                                {totals.completed}
                            </span>
                        </div>
                        <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            backgroundColor: '#DCFCE7',
                            color: '#16A34A',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <CheckCircle2 size={20} />
                        </div>
                    </div>

                    {/* Card 4: Evaluation Pending */}
                    <div onClick={() => navigate('/reports?assessmentStatus=evaluation_pending')} title="Click to view evaluation pending crew in Reports" style={{ cursor: 'pointer',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #D7E3EF',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 1px 3px rgba(11, 35, 65, 0.04)'
                    }}>
                        <div>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                                Evaluation Pending
                            </span>
                            <span style={{ fontSize: '22px', fontWeight: 800, color: '#D97706' }}>
                                {totals.evalPending}
                            </span>
                        </div>
                        <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            backgroundColor: '#FEF3C7',
                            color: '#D97706',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Clock size={20} />
                        </div>
                    </div>

                    {/* Card 5: Approval Pending */}
                    <div onClick={() => navigate('/reports?assessmentStatus=pending_approval')} title="Click to view approval pending crew in Reports" style={{ cursor: 'pointer',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #D7E3EF',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 1px 3px rgba(11, 35, 65, 0.04)'
                    }}>
                        <div>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                                Approval Pending
                            </span>
                            <span style={{ fontSize: '22px', fontWeight: 800, color: '#DC2626' }}>
                                {totals.approvalPending}
                            </span>
                        </div>
                        <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            backgroundColor: '#FEE2E2',
                            color: '#DC2626',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <AlertCircle size={20} />
                        </div>
                    </div>
                </div>

                {/* Professional Data Table Card */}
                <div style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #D7E3EF',
                    boxShadow: '0 2px 6px rgba(11, 35, 65, 0.05)',
                    overflow: 'hidden'
                }}>
                    {/* Table Card Toolbar */}
                    <div style={{
                        padding: '18px 24px',
                        borderBottom: '1px solid #E2E8F0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '14px',
                        backgroundColor: '#FFFFFF'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                                Traffic Inspector Jurisdictions
                            </h3>
                            <span style={{
                                padding: '3px 9px',
                                borderRadius: '12px',
                                backgroundColor: '#F1F5F9',
                                color: '#475569',
                                fontSize: '12px',
                                fontWeight: 700
                            }}>
                                {filteredData.length} {filteredData.length === 1 ? 'Record' : 'Records'}
                            </span>
                        </div>

                        {/* Search Input Filter */}
                        <div style={{
                            position: 'relative',
                            width: '280px',
                            maxWidth: '100%'
                        }}>
                            <Search size={15} style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#94A3B8',
                                pointerEvents: 'none'
                            }} />
                            <input
                                type="text"
                                placeholder="Search TI name or HRMS ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 32px 8px 36px',
                                    borderRadius: '8px',
                                    border: '1px solid #CBD5E1',
                                    fontSize: '13px',
                                    color: '#0F172A',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    transition: 'border-color 0.15s ease'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#2563EB'}
                                onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: '#94A3B8',
                                        cursor: 'pointer',
                                        padding: 0,
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                    title="Clear search"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {filteredData.length === 0 ? (
                        <div style={{ padding: '56px 24px', textAlign: 'center', color: '#64748B' }}>
                            <Layers size={36} style={{ color: '#CBD5E1', marginBottom: '12px' }} />
                            <p style={{ fontSize: '15px', fontWeight: 600, color: '#334155', margin: '0 0 4px 0' }}>
                                {searchQuery ? 'No Traffic Inspectors match your search' : 'No Data Available'}
                            </p>
                            <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>
                                {searchQuery ? 'Try clearing or modifying your search query.' : 'There are currently no Traffic Inspector assessment records.'}
                            </p>
                        </div>
                    ) : (
                        <div className="table-responsive" style={{ width: '100%', overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                                        <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            Traffic Inspector
                                        </th>
                                        <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#475569', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            HRMS ID
                                        </th>
                                        <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#475569', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            Total Monitored Crew
                                        </th>
                                        <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#475569', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            Completed
                                        </th>
                                        <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#475569', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            Evaluation Pending
                                        </th>
                                        <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#475569', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            Approval Pending
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((row) => (
                                        <tr 
                                            key={row.tiId} 
                                            style={{ 
                                                borderBottom: '1px solid #EEF2F6',
                                                transition: 'background-color 0.15s ease'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            {/* Traffic Inspector Profile */}
                                            <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '50%',
                                                        backgroundColor: '#EFF6FF',
                                                        color: '#1D4ED8',
                                                        border: '1px solid #BFDBFE',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '12.5px',
                                                        fontWeight: 800,
                                                        flexShrink: 0
                                                    }}>
                                                        {getInitials(row.tiName)}
                                                    </div>
                                                    <div>
                                                        <div onClick={() => navigate(`/reports?tiId=${row.tiId}`)} title="View workforce under this TI" style={{ fontWeight: 700, color: '#0F172A', fontSize: '14px', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'transparent', transition: 'text-decoration-color 0.15s ease' }} onMouseEnter={(e) => e.currentTarget.style.textDecorationColor = '#2563EB'} onMouseLeave={(e) => e.currentTarget.style.textDecorationColor = 'transparent'}>
                                                            {row.tiName}
                                                        </div>
                                                        <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 500, marginTop: '1px' }}>
                                                            {row.stationName || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* HRMS ID */}
                                            <td style={{ padding: '14px 20px', textAlign: 'center', verticalAlign: 'middle' }}>
                                                <span style={{
                                                    fontFamily: 'monospace',
                                                    fontSize: '12.5px',
                                                    fontWeight: 700,
                                                    color: '#334155',
                                                    backgroundColor: '#F1F5F9',
                                                    border: '1px solid #E2E8F0',
                                                    borderRadius: '6px',
                                                    padding: '3px 8px',
                                                    display: 'inline-block'
                                                }}>
                                                    {row.tiHrmsId || '—'}
                                                </span>
                                            </td>

                                            {/* Total Employees */}
                                            <td style={{ padding: '14px 20px', textAlign: 'center', verticalAlign: 'middle' }}>
                                                <button type="button" onClick={() => navigate(`/reports?tiId=${row.tiId}`)} title="View crew under this TI" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', fontWeight: 700, fontSize: '13px', color: '#0F172A', cursor: 'pointer', transition: 'all 0.15s ease' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#EFF6FF'; e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.color = '#1D4ED8'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#0F172A'; }}><Users size={14} style={{ color: 'inherit' }} />{row.totalEmployees}</button>
                                            </td>

                                            {/* Completed */}
                                            <td style={{ padding: '14px 20px', textAlign: 'center', verticalAlign: 'middle' }}>
                                                <button type="button" onClick={() => navigate(`/reports?tiId=${row.tiId}&assessmentStatus=completed`)} title="View completed evaluations" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '9999px', backgroundColor: '#DCFCE7', color: '#15803D', border: '1px solid #BBF7D0', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s ease' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#BBF7D0'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(22, 163, 74, 0.2)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#DCFCE7'; e.currentTarget.style.boxShadow = 'none'; }}><CheckCircle2 size={13} />{row.completedAssessments}</button>
                                            </td>

                                            {/* Evaluation Pending */}
                                            <td style={{ padding: '14px 20px', textAlign: 'center', verticalAlign: 'middle' }}>
                                                <button type="button" onClick={() => navigate(`/reports?tiId=${row.tiId}&assessmentStatus=evaluation_pending`)} title="View evaluation pending crew" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '9999px', backgroundColor: row.pendingAssessments > 0 ? '#FEF3C7' : '#F8FAFC', color: row.pendingAssessments > 0 ? '#B45309' : '#94A3B8', border: row.pendingAssessments > 0 ? '1px solid #FDE68A' : '1px solid #E2E8F0', fontWeight: 700, fontSize: '13px', cursor: row.pendingAssessments > 0 ? 'pointer' : 'default', transition: 'all 0.15s ease' }} onMouseEnter={(e) => { if (row.pendingAssessments > 0) { e.currentTarget.style.backgroundColor = '#FDE68A'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(217, 119, 6, 0.2)'; } }} onMouseLeave={(e) => { if (row.pendingAssessments > 0) { e.currentTarget.style.backgroundColor = '#FEF3C7'; e.currentTarget.style.boxShadow = 'none'; } }}><Clock size={13} />{row.pendingAssessments}</button>
                                            </td>

                                            {/* Approval Pending */}
                                            <td style={{ padding: '14px 20px', textAlign: 'center', verticalAlign: 'middle' }}>
                                                <button type="button" onClick={() => navigate(`/reports?tiId=${row.tiId}&assessmentStatus=pending_approval`)} title="View approval pending crew" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '9999px', backgroundColor: row.approvalPending > 0 ? '#FEE2E2' : '#F8FAFC', color: row.approvalPending > 0 ? '#B91C1C' : '#94A3B8', border: row.approvalPending > 0 ? '1px solid #FECACA' : '1px solid #E2E8F0', fontWeight: 700, fontSize: '13px', cursor: row.approvalPending > 0 ? 'pointer' : 'default', transition: 'all 0.15s ease' }} onMouseEnter={(e) => { if (row.approvalPending > 0) { e.currentTarget.style.backgroundColor = '#FECACA'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(220, 38, 38, 0.2)'; } }} onMouseLeave={(e) => { if (row.approvalPending > 0) { e.currentTarget.style.backgroundColor = '#FEE2E2'; e.currentTarget.style.boxShadow = 'none'; } }}><AlertCircle size={13} />{row.approvalPending}</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>

                                {/* Total Summary Footer */}
                                <tfoot>
                                    <tr style={{ backgroundColor: '#F8FAFC', borderTop: '2px solid #CBD5E1' }}>
                                        <td style={{ padding: '16px 20px', fontWeight: 800, color: '#0F172A', fontSize: '13.5px' }}>
                                            Total Across All TIs
                                        </td>
                                        <td style={{ padding: '16px 20px', textAlign: 'center', color: '#94A3B8', fontWeight: 600 }}>
                                            —
                                        </td>
                                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                                            <button type="button" onClick={() => navigate('/reports')} title="View all division monitored crew" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', backgroundColor: '#FFFFFF', border: '1.5px solid #CBD5E1', fontWeight: 800, fontSize: '13px', color: '#0F172A', cursor: 'pointer', transition: 'all 0.15s ease' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#EFF6FF'; e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.color = '#1D4ED8'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#0F172A'; }}><Users size={14} style={{ color: 'inherit' }} />{totals.totalStaff}</button>
                                        </td>
                                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                                            <button type="button" onClick={() => navigate('/reports?assessmentStatus=completed')} title="View all completed evaluations across division" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '9999px', backgroundColor: '#DCFCE7', color: '#15803D', border: '1.5px solid #86EFAC', fontWeight: 800, fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s ease' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#BBF7D0'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(22, 163, 74, 0.2)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#DCFCE7'; e.currentTarget.style.boxShadow = 'none'; }}><CheckCircle2 size={13} />{totals.completed}</button>
                                        </td>
                                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                                            <button type="button" onClick={() => navigate('/reports?assessmentStatus=evaluation_pending')} title="View all evaluation pending crew across division" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '9999px', backgroundColor: totals.evalPending > 0 ? '#FEF3C7' : '#F8FAFC', color: totals.evalPending > 0 ? '#B45309' : '#94A3B8', border: totals.evalPending > 0 ? '1.5px solid #FCD34D' : '1px solid #E2E8F0', fontWeight: 800, fontSize: '13px', cursor: totals.evalPending > 0 ? 'pointer' : 'default', transition: 'all 0.15s ease' }} onMouseEnter={(e) => { if (totals.evalPending > 0) { e.currentTarget.style.backgroundColor = '#FDE68A'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(217, 119, 6, 0.2)'; } }} onMouseLeave={(e) => { if (totals.evalPending > 0) { e.currentTarget.style.backgroundColor = '#FEF3C7'; e.currentTarget.style.boxShadow = 'none'; } }}><Clock size={13} />{totals.evalPending}</button>
                                        </td>
                                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                                            <button type="button" onClick={() => navigate('/reports?assessmentStatus=pending_approval')} title="View all approval pending crew across division" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '9999px', backgroundColor: totals.approvalPending > 0 ? '#FEE2E2' : '#F8FAFC', color: totals.approvalPending > 0 ? '#B91C1C' : '#94A3B8', border: totals.approvalPending > 0 ? '1.5px solid #FCA5A5' : '1px solid #E2E8F0', fontWeight: 800, fontSize: '13px', cursor: totals.approvalPending > 0 ? 'pointer' : 'default', transition: 'all 0.15s ease' }} onMouseEnter={(e) => { if (totals.approvalPending > 0) { e.currentTarget.style.backgroundColor = '#FECACA'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(220, 38, 38, 0.2)'; } }} onMouseLeave={(e) => { if (totals.approvalPending > 0) { e.currentTarget.style.backgroundColor = '#FEE2E2'; e.currentTarget.style.boxShadow = 'none'; } }}><AlertCircle size={13} />{totals.approvalPending}</button>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default TiApprovalsPage;

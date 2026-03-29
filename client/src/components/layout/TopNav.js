import Dropdown from 'react-bootstrap/Dropdown';
import neu from '../../assets/images/northeastern.jpg';
import { useAuthUser } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Outlet, useEffect, useState } from 'react-router-dom';
import { getUnreadAlertsApi } from '../../services/jobAlert.service';
import './TopNav.css';

// TopNav displays user data safely:
// - React automatically escapes all text content in JSX (prevents XSS)
// - User data from API is treated as untrusted and escaped before rendering
// - No dangerouslySetInnerHTML used anywhere in this component
const TopNav = () => {
    const navigate = useNavigate();
    const { logout, user, isAuthenticated } = useAuthUser();
    const [alerts, setAlerts] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Redirect to login when logout completes
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    // Load unread alerts on mount
    useEffect(() => {
        if (isAuthenticated) {
            loadUnreadAlerts();
            // Refresh alerts every 30 seconds
            const interval = setInterval(loadUnreadAlerts, 30000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated]);

    const loadUnreadAlerts = async () => {
        try {
            const response = await getUnreadAlertsApi(3);
            if (response.ok) {
                const data = await response.json();
                setAlerts(data.data || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (err) {
            console.error('Error loading alerts:', err);
        }
    };

    const handleLogout = async () => {
        await logout();
    };

    const gotoHomeJob = async () => {
        navigate('/joblist');
    };

    const gotoAlerts = () => {
        navigate('/joblist/alerts');
    };
    return (
        <div id="top-nav-wrapper" className="container-fluid">
            <div className="d-flex justify-content-between align-items-center px-3" id="top-bar-profile">
                <div>
                    <img src={neu} alt="Husky Logo" style={{ maxHeight: '50px' }} />
                </div>

                <div className="text-center flex-grow-1">
                    <h1 className="job-portal-title mb-0">Job Portal</h1>
                </div>

                <div className="topnav-actions">
                    {/* Alerts Bell Icon */}
                    <Dropdown className="alerts-dropdown">
                        <Dropdown.Toggle variant="light" id="alerts-dropdown" className="alerts-bell">
                            🔔
                            {unreadCount > 0 && (
                                <span className="alerts-badge">{unreadCount}</span>
                            )}
                        </Dropdown.Toggle>
                        <Dropdown.Menu align="end" className="alerts-menu">
                            {alerts.length > 0 ? (
                                <>
                                    {alerts.map((alert) => (
                                        <Dropdown.Item
                                            key={alert.id}
                                            className="alert-dropdown-item"
                                            onClick={gotoAlerts}
                                        >
                                            <div className="alert-item-preview">
                                                <p className="alert-item-preview-title">{alert.jobTitle}</p>
                                                <p className="alert-item-preview-company">{alert.companyName}</p>
                                            </div>
                                        </Dropdown.Item>
                                    ))}
                                    <Dropdown.Divider />
                                    <Dropdown.Item onClick={gotoAlerts} className="see-all-alerts">
                                        See All Alerts →
                                    </Dropdown.Item>
                                </>
                            ) : (
                                <Dropdown.Item disabled className="no-alerts">
                                    No unread alerts
                                </Dropdown.Item>
                            )}
                        </Dropdown.Menu>
                    </Dropdown>

                    {/* User Dropdown */}
                    <Dropdown>
                        <Dropdown.Toggle variant="dark" id="dropdown-basic">
                            Good Day {user?.firstName || 'User'}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item onClick={gotoHomeJob}>Dashboard</Dropdown.Item>
                            <Dropdown.Item as={Link} to="/joblist/email-analytics">📧 Email Analytics</Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
            </div>

            <div style={{ paddingTop: '20px' }}>
                <Outlet />
            </div>
        </div>
    );
};

export default TopNav;

import Dropdown from 'react-bootstrap/Dropdown';
import neu from '../../assets/images/northeastern.jpg';
import { useAuthUser } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Outlet, useEffect } from 'react-router-dom';

const TopNav = () => {
    const navigate = useNavigate();
    const { logout, user, isAuthenticated } = useAuthUser();

    // Redirect to login when logout completes
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    const handleLogout = async () => {
        await logout();
    };

    const gotoHomeJob = async () => {
        navigate('/joblist');
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

                <div>
                    <Dropdown>
                        <Dropdown.Toggle variant="dark" id="dropdown-basic">
                            Good Day {user.firstName}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item onClick={gotoHomeJob}>Dashboard</Dropdown.Item>
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

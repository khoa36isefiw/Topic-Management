import { Outlet } from 'react-router-dom';

function LoginLayout() {
  return (
    <>
      <div className='d-flex flex-column min-vh-100 justify-content-center align-items-center'>
        <Outlet />
      </div>
    </>
  );
}

export default LoginLayout;

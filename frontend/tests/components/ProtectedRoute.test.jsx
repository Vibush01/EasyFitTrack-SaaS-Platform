import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../src/context/AuthContext';
import ProtectedRoute from '../../src/components/ProtectedRoute';

const renderWithAuth = (contextValue, children = <div>Protected Content</div>) => {
    return render(
        <AuthContext.Provider value={contextValue}>
            <MemoryRouter>
                <ProtectedRoute>{children}</ProtectedRoute>
            </MemoryRouter>
        </AuthContext.Provider>
    );
};

describe('ProtectedRoute', () => {
    it('should render children when user is authenticated', () => {
        renderWithAuth(
            { user: { id: '123', role: 'member' }, loading: false },
            <div>Dashboard Content</div>
        );

        expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    });

    it('should redirect to /login when user is null', () => {
        renderWithAuth({ user: null, loading: false });

        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should show loading state when loading is true', () => {
        renderWithAuth({ user: null, loading: true });

        expect(screen.getByText('Loading...')).toBeInTheDocument();
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should show loading state even if user exists but loading is true', () => {
        renderWithAuth({ user: { id: '123', role: 'member' }, loading: true });

        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
});

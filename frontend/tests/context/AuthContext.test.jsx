import { render, screen, act } from '@testing-library/react';
import { AuthContext, AuthProvider } from '../../src/context/AuthContext';
import { useContext } from 'react';

vi.mock('axios', () => ({
    default: {
        get: vi.fn(() => Promise.resolve({ data: { name: 'Test', email: 'test@test.com' } })),
    },
}));

const AuthConsumer = () => {
    const { user, loading, login, logout } = useContext(AuthContext);
    return (
        <div>
            <span data-testid="user">{user ? JSON.stringify(user) : 'null'}</span>
            <span data-testid="loading">{String(loading)}</span>
            <button data-testid="login-btn" onClick={() => login({ id: '1', role: 'member' }, 'fake-jwt-token')}>Login</button>
            <button data-testid="logout-btn" onClick={() => logout()}>Logout</button>
        </div>
    );
};

describe('AuthContext', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('should provide default user as null when no token exists', () => {
        render(
            <AuthProvider>
                <AuthConsumer />
            </AuthProvider>
        );

        expect(screen.getByTestId('user')).toHaveTextContent('null');
    });

    it('should set loading to false after initialization with no token', async () => {
        render(
            <AuthProvider>
                <AuthConsumer />
            </AuthProvider>
        );

        await vi.waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('false');
        });
    });

    it('should store token in localStorage when login is called', async () => {
        render(
            <AuthProvider>
                <AuthConsumer />
            </AuthProvider>
        );

        await vi.waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('false');
        });

        await act(async () => {
            screen.getByTestId('login-btn').click();
        });

        expect(localStorage.getItem('token')).toBe('fake-jwt-token');
    });

    it('should clear user and token when logout is called', async () => {
        const fakePayload = btoa(JSON.stringify({ id: '123', role: 'member' }));
        const fakeToken = `eyJhbGciOiJIUzI1NiJ9.${fakePayload}.fakesig`;
        localStorage.setItem('token', fakeToken);

        render(
            <AuthProvider>
                <AuthConsumer />
            </AuthProvider>
        );

        await act(async () => {
            screen.getByTestId('logout-btn').click();
        });

        expect(localStorage.getItem('token')).toBeNull();
        expect(screen.getByTestId('user')).toHaveTextContent('null');
    });
});

import React from 'react';
import './ErrorBoundary.css';

/**
 * Error Boundary Component
 * Catches JavaScript errors in child component tree and displays fallback UI
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Always log errors for debugging
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        
        // Update state with error details
        this.setState({
            error,
            errorInfo
        });
        
        // You can also log to an error reporting service here
        // e.g., Sentry, LogRocket, etc.
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
        
        // Call optional onReset callback
        if (this.props.onReset) {
            this.props.onReset();
        }
    }

    render() {
        if (this.state.hasError) {
            // Custom fallback UI from props
            if (this.props.fallback) {
                const fallbackResult = this.props.fallback(this.state.error, this.handleReset);
                // Убеждаемся, что fallback возвращает валидное значение
                if (fallbackResult !== null && fallbackResult !== undefined) {
                    return fallbackResult;
                }
            }
            
            // Default fallback UI
            return (
                <div className="error-boundary">
                    <div className="error-boundary-content">
                        <div className="error-boundary-icon">⚠️</div>
                        <h1 className="error-boundary-title">
                            {this.props.title || 'Что-то пошло не так'}
                        </h1>
                        <p className="error-boundary-message">
                            {this.props.message || 'Произошла ошибка при отображении этой части приложения.'}
                        </p>
                        
                        {this.state.error && (
                            <details className="error-boundary-details">
                                <summary>Детали ошибки</summary>
                                <pre className="error-boundary-stack">
                                    {this.state.error.toString()}
                                    {this.state.error?.stack && (
                                        <>
                                            {'\n\nStack trace:\n'}
                                            {this.state.error.stack}
                                        </>
                                    )}
                                    {this.state.errorInfo?.componentStack && (
                                        <>
                                            {'\n\nComponent stack:\n'}
                                            {this.state.errorInfo.componentStack}
                                        </>
                                    )}
                                </pre>
                            </details>
                        )}
                        
                        <div className="error-boundary-actions">
                            <button 
                                className="error-boundary-button"
                                onClick={this.handleReset}
                            >
                                Попробовать снова
                            </button>
                            
                            {this.props.showReloadButton && (
                                <button 
                                    className="error-boundary-button secondary"
                                    onClick={() => window.location.reload()}
                                >
                                    Перезагрузить страницу
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;






import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="empty">
      <h1>Page not found</h1>
      <p>That page or recipe doesn’t exist.</p>
      <Link to="/" className="btn primary">
        Go home
      </Link>
    </div>
  );
}

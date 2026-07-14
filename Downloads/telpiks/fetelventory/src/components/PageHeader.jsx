import { useAuth } from "../context/AuthContext";

export default function PageHeader({
  search,
  onSearchChange,
  placeholder = "Search...",
  user,
}) {
  const { user: loggedInUser } = useAuth();
  const displayUser = user || loggedInUser || { name: "Guest", email: "" };

  return (
    <div className="dash-header">
      <div className="search-row">
        <input
          className="search-input"
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="dash-user">
        <div className="user-avatar">
          <svg viewBox="0 0 24 24" fill="#aaa" width="32" height="32">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
        </div>

        <div className="user-info">
          <span className="user-name">{displayUser.name}</span>
          <span className="user-email">{displayUser.email}</span>
        </div>
      </div>
    </div>
  );
}

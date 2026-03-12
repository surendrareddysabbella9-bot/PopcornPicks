import './SkeletonCard.css';

export function SkeletonCard() {
    return (
        <div className="skeleton-card">
            <div className="skeleton-poster shimmer" />
            <div className="skeleton-info">
                <div className="skeleton-title shimmer" />
                <div className="skeleton-year shimmer" />
            </div>
        </div>
    );
}

export function SkeletonRow({ count = 6 }) {
    return (
        <div className="skeleton-grid">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}

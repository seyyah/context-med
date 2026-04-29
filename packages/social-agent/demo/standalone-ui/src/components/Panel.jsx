export function Panel({ kicker, title, description, actions, children, className = '' }) {
  return (
    <section className={`panel ${className}`.trim()}>
      {(kicker || title || description || actions) && (
        <header className="panel-header">
          <div>
            {kicker ? <span className="kicker">{kicker}</span> : null}
            {title ? <h2>{title}</h2> : null}
            {description ? <p>{description}</p> : null}
          </div>
          {actions ? <div className="panel-actions">{actions}</div> : null}
        </header>
      )}
      {children}
    </section>
  );
}

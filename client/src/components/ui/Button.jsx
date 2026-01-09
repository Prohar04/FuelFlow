import './Button.css';

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  onClick,
  type = 'button',
  ...props 
}) {
  const className = `btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${disabled || loading ? 'btn-disabled' : ''}`;

  return (
    <button
      type={type}
      className={className}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <div className="btn-spinner" />}
      {!loading && leftIcon && <span className="btn-icon">{leftIcon}</span>}
      <span>{children}</span>
      {!loading && rightIcon && <span className="btn-icon">{rightIcon}</span>}
    </button>
  );
}

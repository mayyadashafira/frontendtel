export default function ConfirmDeleteModal({
  open,
  title = "Delete Item",
  description = "This action cannot be undone.",
  itemLabel,
  onCancel,
  onConfirm,
  isDeleting = false,
}) {
  if (!open) return null;

  return (
    <div className="dash-modal-overlay" onClick={onCancel}>
      <div
        className="dash-modal-box confirm-modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dash-modal-header">
          <h2 className="dash-modal-title">{title}</h2>
          <button className="dash-modal-close" onClick={onCancel}>
            ×
          </button>
        </div>

        <div className="dash-modal-body">
          <p className="confirm-modal-text">
            {description}
            {itemLabel && (
              <>
                {" "}
                <strong>{itemLabel}</strong>
              </>
            )}
          </p>
        </div>

        <div className="dash-modal-footer">
          <button className="dash-btn-cancel" onClick={onCancel} disabled={isDeleting}>
            Cancel
          </button>
          <button
            className="dash-btn-save confirm-btn-danger"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

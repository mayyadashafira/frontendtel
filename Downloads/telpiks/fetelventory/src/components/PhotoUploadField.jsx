import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";

export default function PhotoUploadField({ value, onChange, label = "Photo" }) {
  const inputRef = useRef(null);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
  }

  function handleRemove(e) {
    e.stopPropagation();
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="photo-upload-field">
      <label>{label}</label>
      <div className="photo-upload-box" onClick={() => inputRef.current?.click()}>
        {value ? (
          <>
            <img src={value} alt="Preview" className="photo-upload-preview" />
            <button
              type="button"
              className="photo-upload-remove"
              onClick={handleRemove}
              title="Remove photo"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <div className="photo-upload-placeholder">
            <ImagePlus size={24} />
            <span>Click to upload</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </div>
  );
}

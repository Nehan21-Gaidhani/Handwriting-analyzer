import cv2
import numpy as np

# 🚫 STEP 1: Detect whether image is real pen-paper handwriting (not printed)
def is_human_handwriting(img_np):
    img = cv2.resize(img_np, (512, 128))
    blur = cv2.GaussianBlur(img, (5, 5), 0)
    edges = cv2.Canny(blur, 30, 100)

    # Check for lines
    lines = cv2.HoughLines(edges, 1, np.pi / 180, 100)
    if lines is not None and len(lines) > 10:
        return False

    # Threshold and find contours
    _, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if len(contours) < 4:
        return False

    # New Rule: Check if most contours look like small letters
    small_letter_like = 0
    for c in contours:
        x, y, w, h = cv2.boundingRect(c)
        aspect_ratio = w / float(h)
        area = w * h
        if 0.2 < aspect_ratio < 2.5 and 50 < area < 400:
            small_letter_like += 1

    if small_letter_like < 3:
        return False

    # Final rule: stroke variation & sharpness
    stroke_std = np.std(img)
    lap_var = cv2.Laplacian(img, cv2.CV_64F).var()

    if stroke_std < 10 or lap_var < 15:
        return False

    return True



# 🧠 STEP 2: Graphology-based visual trait analysis
def analyze_visual_traits(img_np):
    traits = []

    # Resize and binarize
    img = cv2.resize(img_np, (128, 32))
    blur = cv2.GaussianBlur(img, (5, 5), 0)
    _, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    # Stroke pressure estimate
    stroke_std = np.std(img)

    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return ["Image too faint or unclear"]

    # Extract contour bounding boxes and areas
    areas = [cv2.contourArea(c) for c in contours]
    bounding_boxes = [cv2.boundingRect(c) for c in contours]

    # 📌 Rule-based trait analysis:

    # 1. Confidence → high stroke variance
    if stroke_std > 25:
        traits.append("Confident")

    # 2. Attention to detail → many small letters
    small_letters = [w * h for x, y, w, h in bounding_boxes if w < 15 and h < 15]
    if len(small_letters) > 10:
        traits.append("Attention to detail")

    # 3. Impatience → many sharp corners
    corners = sum([len(cv2.approxPolyDP(c, 3, True)) for c in contours])
    if corners / len(contours) > 7:
        traits.append("Impatient")

    # 4. Introvert → very small letters (low width)
    widths = [w for x, y, w, h in bounding_boxes]
    if np.mean(widths) < 10:
        traits.append("Introvert")

    # 5. Extrovert → large open letters
    if np.mean(widths) > 20:
        traits.append("Extrovert")

    # 6. Honest vs. Deceptive → white pixel ratio (clarity)
    white_pixel_ratio = np.count_nonzero(thresh) / (thresh.shape[0] * thresh.shape[1])
    if white_pixel_ratio > 0.4:
        traits.append("Honest")
    elif white_pixel_ratio < 0.2:
        traits.append("Possibly Deceptive")

    return traits

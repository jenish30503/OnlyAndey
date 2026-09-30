W = 280
H = W * (325 / 576)

img_rendered_height = W * (1024 / 576)
shift_amount = H * (179 / 325)

print(f"Container: {W} x {H}")
print(f"Image rendered height: {img_rendered_height}")
print(f"Shift amount (pixels): {shift_amount}")
print(f"Should equal W * (179/576): {W * (179/576)}")

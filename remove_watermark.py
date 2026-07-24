import os
import subprocess
import sys

def main():
    input_video = sys.argv[1] if len(sys.argv) > 1 else "Hand_opening_laptop_on_desk_202607232139.mp4"
    output_video = sys.argv[2] if len(sys.argv) > 2 else os.path.splitext(input_video)[0] + "_no_watermark.mp4"
    
    # Bounding box of the Google Gemini sparkle watermark for 1080p (1920x1080)
    # Watermark center is at (1740, 900)
    # Dimensions ~72x72 with margin -> 92x92 at x=1694, y=854
    x = 1694
    y = 854
    w = 92
    h = 92
    
    if not os.path.exists(input_video):
        print(f"Error: Input video file '{input_video}' not found in the current directory.")
        sys.exit(1)
        
    print(f"Starting watermark removal from '{input_video}'...")
    print(f"Watermark coordinates: x={x}, y={y}, width={w}, height={h}")
    print("Executing FFmpeg with delogo filter...")
    
    # FFmpeg command to remove the logo and copy the audio stream losslessly
    # We use libx264 with CRF 15 (virtually lossless) and preset 'slow' for high quality compression
    command = [
        "ffmpeg", "-y",
        "-i", input_video,
        "-vf", f"delogo=x={x}:y={y}:w={w}:h={h}",
        "-c:v", "libx264",
        "-crf", "15",
        "-preset", "fast",
        "-c:a", "copy",
        output_video
    ]
    
    try:
        # Run command and print progress
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        
        while True:
            line = process.stdout.readline()
            if not line and process.poll() is not None:
                break
            if line:
                # Print progress lines from ffmpeg (fps, speed, etc.)
                if "frame=" in line or "time=" in line:
                    sys.stdout.write("\r" + line.strip())
                    sys.stdout.flush()
                    
        process.communicate()
        print("\n")
        
        if process.returncode == 0:
            print("Watermark removal completed successfully!")
            print(f"Output video saved to: '{output_video}'")
        else:
            print(f"\nFFmpeg exited with error code {process.returncode}")
            sys.exit(1)
            
    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

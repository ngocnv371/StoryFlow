
/**
 * Download a video from a Blob object with enhanced error handling and logging
 */
export function downloadVideo(videoBlob: Blob, filename: string): void {
  console.log('💾 Starting video download...');
  console.log(`   - Filename: ${filename}`);
  console.log(`   - Size: ${videoBlob.size} bytes`);
  console.log(`   - Type: ${videoBlob.type}`);
  
  if (videoBlob.size === 0) {
    console.error('🚨 Cannot download empty video blob');
    throw new Error('Cannot download empty video file');
  }
  
  try {
    const url = URL.createObjectURL(videoBlob);
    console.log(`✅ Object URL created: ${url.substring(0, 50)}...`);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up after a delay to ensure download started
    setTimeout(() => {
      URL.revokeObjectURL(url);
      console.log('🧹 Object URL cleaned up');
    }, 1000);
    
    console.log('✅ Download initiated successfully');
    
  } catch (error) {
    console.error('🚨 Download failed:', error);
    throw new Error(`Download failed: ${error.message}`);
  }
}
import React, { useRef, useState } from 'react';
import logger from '@/utils/logger';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import logger from '@/utils/logger';
import { Button } from '@/components/ui/button';
import logger from '@/utils/logger';
import { Camera, X, RotateCw, CheckCircle, Loader2 } from 'lucide-react';
import logger from '@/utils/logger';
import { toast } from 'sonner';
import logger from '@/utils/logger';

export default function MobileCameraCapture({ open, onOpenChange, onCapture }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [facingMode, setFacingMode] = useState('environment'); // 'user' or 'environment'

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });
            
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.play();
            }
            
            setStream(mediaStream);
        } catch (error) {
            logger.error('Camera error:', error);
            toast.error('Failed to access camera');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
            setCapturedImage(blob);
            stopCamera();
        }, 'image/jpeg', 0.95);
    };

    const retakePhoto = () => {
        setCapturedImage(null);
        startCamera();
    };

    const confirmPhoto = async () => {
        if (!capturedImage) return;

        setProcessing(true);
        try {
            const file = new File([capturedImage], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            await onCapture(file);
            onOpenChange(false);
            setCapturedImage(null);
        } catch (error) {
            toast.error('Failed to process photo');
        } finally {
            setProcessing(false);
        }
    };

    const switchCamera = () => {
        stopCamera();
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
        setTimeout(startCamera, 100);
    };

    React.useEffect(() => {
        if (open) {
            startCamera();
        } else {
            stopCamera();
            setCapturedImage(null);
        }
        
        return () => stopCamera();
    }, [open, facingMode]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-full h-screen p-0 m-0 rounded-none bg-black">
                {/* Camera Header */}
                <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent safe-area-inset">
                    <div className="flex items-center justify-between px-4 h-16">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                            className="text-white min-h-[50px] min-w-[50px]"
                        >
                            <X className="w-6 h-6" />
                        </Button>
                        
                        <h3 className="text-white font-medium" style={{ fontFamily: 'Playfair Display, serif' }}>
                            Capture Document
                        </h3>

                        {!capturedImage && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={switchCamera}
                                className="text-white min-h-[50px] min-w-[50px]"
                            >
                                <RotateCw className="w-5 h-5" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Camera View */}
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                    {!capturedImage ? (
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />
                            <canvas ref={canvasRef} className="hidden" />
                            
                            {/* Camera Grid Overlay */}
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                                    {[...Array(9)].map((_, i) => (
                                        <div key={i} className="border border-white/20" />
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <img
                            src={URL.createObjectURL(capturedImage)}
                            alt="Captured"
                            className="w-full h-full object-contain"
                        />
                    )}
                </div>

                {/* Camera Controls */}
                <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pb-safe">
                    <div className="flex items-center justify-center gap-8 py-8">
                        {!capturedImage ? (
                            <Button
                                onClick={capturePhoto}
                                className="w-20 h-20 rounded-full bg-white hover:bg-white/90 p-0 shadow-lg"
                            >
                                <div className="w-16 h-16 rounded-full border-4 border-[#0F172A]" />
                            </Button>
                        ) : (
                            <>
                                <Button
                                    onClick={retakePhoto}
                                    disabled={processing}
                                    className="min-h-[50px] px-6 bg-white/20 hover:bg-white/30 text-white rounded-full"
                                >
                                    <RotateCw className="w-5 h-5 mr-2" />
                                    Retake
                                </Button>
                                
                                <Button
                                    onClick={confirmPhoto}
                                    disabled={processing}
                                    className="min-h-[50px] px-6 bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-[#0F172A] rounded-full font-medium shadow-lg"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5 mr-2" />
                                            Use Photo
                                        </>
                                    )}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
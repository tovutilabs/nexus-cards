'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QrCode, Camera, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createApiClient } from '@/lib/api-client';

interface QRContactData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  notes?: string;
}

export default function QRScanPage() {
  const router = useRouter();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    return () => {
      // Cleanup: stop stream when component unmounts
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const startScanning = async () => {
    setError(null);
    setScanning(true);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        scanQRCode();
      }
    } catch (err: any) {
      setError('Unable to access camera. Please grant camera permissions.');
      setScanning(false);
      console.error('Camera error:', err);
    }
  };

  const stopScanning = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setScanning(false);
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !scanning) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      try {
        // Use jsQR library (needs to be installed)
        // For now, we'll use a simplified approach
        // In production, install jsQR: npm install jsqr
        const code = detectQRCode(imageData);

        if (code) {
          handleQRCodeDetected(code);
          return;
        }
      } catch (err) {
        console.error('QR scan error:', err);
      }
    }

    // Continue scanning
    if (scanning) {
      requestAnimationFrame(scanQRCode);
    }
  };

  const detectQRCode = (_imageData: ImageData): string | null => {
    // Placeholder for QR detection
    // In production, use jsQR library:
    // import jsQR from 'jsqr';
    // const code = jsQR(_imageData.data, _imageData.width, _imageData.height);
    // return code ? code.data : null;
    return null;
  };

  const handleQRCodeDetected = async (data: string) => {
    if (processing) return;

    setProcessing(true);
    stopScanning();

    try {
      const contactData: QRContactData = JSON.parse(data);

      // Validate required fields
      if (!contactData.firstName || !contactData.lastName || !contactData.email) {
        throw new Error('Invalid QR code data');
      }

      // Create contact
      const apiClient = createApiClient();
      await apiClient.post('/contacts', {
        ...contactData,
        source: 'QR',
      });

      toast({
        title: 'Contact Added',
        description: `${contactData.firstName} ${contactData.lastName} has been added to your contacts.`,
      });

      router.push('/dashboard/contacts');
    } catch (err: any) {
      setError(err.message || 'Failed to process QR code. Please try again.');
      setProcessing(false);
    }
  };

  const handleManualEntry = () => {
    router.push('/dashboard/contacts/add');
  };

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-6 w-6" />
            Scan QR Code
          </CardTitle>
          <CardDescription>
            Scan a QR code to add contact information to your wallet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {scanning ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 border-4 border-white/30 rounded-lg pointer-events-none">
                  <div className="absolute inset-0 m-auto w-64 h-64 border-2 border-primary animate-pulse rounded-lg" />
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Camera className="h-24 w-24 text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {!scanning ? (
              <Button onClick={startScanning} size="lg" className="w-full">
                <Camera className="mr-2 h-5 w-5" />
                Start Scanning
              </Button>
            ) : (
              <Button
                onClick={stopScanning}
                variant="outline"
                size="lg"
                className="w-full"
              >
                <X className="mr-2 h-5 w-5" />
                Stop Scanning
              </Button>
            )}

            <Button
              onClick={handleManualEntry}
              variant="outline"
              size="lg"
              className="w-full"
            >
              Add Contact Manually
            </Button>
          </div>

          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium">QR Code Format:</p>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
              {JSON.stringify(
                {
                  firstName: 'John',
                  lastName: 'Doe',
                  email: 'john@example.com',
                  phone: '+1234567890',
                  company: 'Acme Corp',
                  jobTitle: 'CEO',
                  notes: 'Met at conference',
                },
                null,
                2
              )}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

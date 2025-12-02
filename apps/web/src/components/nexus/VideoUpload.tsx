'use client';

import { useState } from 'react';
import { Upload, X, Video, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createApiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

interface VideoUploadProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  endpoint?: string;
  maxSize?: number; // in MB
}

export function VideoUpload({
  label = 'Video',
  value,
  onChange,
  endpoint = 'video',
  maxSize = 100, // 100MB default for videos
}: VideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'url' | 'upload'>('url');
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a video file (MP4, WebM, OGG, or MOV)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast({
        title: 'File too large',
        description: `Video must be smaller than ${maxSize}MB`,
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const apiClient = createApiClient();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/file-upload/${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const result = await response.json();
      onChange(result.file.url);
      
      toast({
        title: 'Success',
        description: 'Video uploaded successfully',
      });
    } catch (error: any) {
      console.error('Video upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload video',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={uploadMode === 'url' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setUploadMode('url')}
          >
            URL
          </Button>
          <Button
            type="button"
            variant={uploadMode === 'upload' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setUploadMode('upload')}
          >
            Upload
          </Button>
        </div>
      </div>

      {uploadMode === 'url' ? (
        <Input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/video.mp4"
        />
      ) : (
        <div className="space-y-3">
          {value ? (
            <div className="relative border rounded-lg p-4 bg-muted">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <Video className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Video uploaded</p>
                  <p className="text-xs text-muted-foreground truncate">{value}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRemove}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <video
                src={value}
                className="mt-3 w-full rounded-md"
                controls
                style={{ maxHeight: '200px' }}
              />
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {uploading ? (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Uploading video...</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload video
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      MP4, WebM, OGG, or MOV (max {maxSize}MB)
                    </p>
                  </>
                )}
              </div>
              <input
                type="file"
                className="hidden"
                accept="video/mp4,video/webm,video/ogg,video/quicktime"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
}

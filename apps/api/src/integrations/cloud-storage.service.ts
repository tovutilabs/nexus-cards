import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';

export interface CloudFile {
  name: string;
  content: Buffer | string;
  mimeType: string;
  folder?: string;
}

export interface CloudStorageIntegration {
  uploadFile(credentials: any, file: CloudFile): Promise<{ id: string; url: string; success: boolean }>;
  testConnection(credentials: any): Promise<boolean>;
  refreshToken?(credentials: any, refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt: Date }>;
}

@Injectable()
export class GoogleDriveService implements CloudStorageIntegration {
  async testConnection(credentials: any): Promise<boolean> {
    try {
      const { accessToken } = credentials;
      
      const response = await axios.get('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async uploadFile(credentials: any, file: CloudFile): Promise<{ id: string; url: string; success: boolean }> {
    try {
      const { accessToken } = credentials;
      
      const metadata: any = {
        name: file.name,
        mimeType: file.mimeType,
      };
      
      if (file.folder) {
        metadata.parents = [file.folder];
      }
      
      const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    const fileBlob = Buffer.isBuffer(file.content) ? new Blob([new Uint8Array(file.content)]) : new Blob([file.content], { type: file.mimeType });
    form.append('file', fileBlob);      const response = await axios.post(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
        form,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      return {
        id: response.data.id,
        url: response.data.webViewLink,
        success: true,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to upload file to Google Drive: ${error.message}`);
    }
  }

  async refreshToken(credentials: any, refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt: Date }> {
    try {
      const { clientId, clientSecret } = credentials;
      
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      });
      
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + response.data.expires_in);
      
      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || refreshToken,
        expiresAt,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to refresh Google Drive token: ${error.message}`);
    }
  }
}

@Injectable()
export class DropboxService implements CloudStorageIntegration {
  async testConnection(credentials: any): Promise<boolean> {
    try {
      const { accessToken } = credentials;
      
      const response = await axios.post(
        'https://api.dropboxapi.com/2/users/get_current_account',
        null,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async uploadFile(credentials: any, file: CloudFile): Promise<{ id: string; url: string; success: boolean }> {
    try {
      const { accessToken } = credentials;
      
      const path = file.folder ? `/${file.folder}/${file.name}` : `/${file.name}`;
      
      const uploadResponse = await axios.post(
        'https://content.dropboxapi.com/2/files/upload',
        file.content,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/octet-stream',
            'Dropbox-API-Arg': JSON.stringify({
              path,
              mode: 'add',
              autorename: true,
              mute: false,
            }),
          },
        }
      );
      
      const shareLinkResponse = await axios.post(
        'https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings',
        {
          path: uploadResponse.data.path_display,
          settings: {
            requested_visibility: 'public',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return {
        id: uploadResponse.data.id,
        url: shareLinkResponse.data.url,
        success: true,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to upload file to Dropbox: ${error.message}`);
    }
  }

  async refreshToken(credentials: any, refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt: Date }> {
    try {
      const { clientId, clientSecret } = credentials;
      
      const response = await axios.post('https://api.dropboxapi.com/oauth2/token', {
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      });
      
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + response.data.expires_in);
      
      return {
        accessToken: response.data.access_token,
        expiresAt,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to refresh Dropbox token: ${error.message}`);
    }
  }
}

import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';

export interface EmailSubscriber {
  email: string;
  firstName?: string;
  lastName?: string;
  tags?: string[];
  status?: 'subscribed' | 'unsubscribed' | 'pending';
}

export interface EmailIntegration {
  addSubscriber(credentials: any, subscriber: EmailSubscriber): Promise<{ id: string; success: boolean }>;
  updateSubscriber(credentials: any, subscriberId: string, subscriber: Partial<EmailSubscriber>): Promise<{ success: boolean }>;
  syncTags(credentials: any, subscriberId: string, tags: string[]): Promise<{ success: boolean }>;
  testConnection(credentials: any): Promise<boolean>;
}

@Injectable()
export class MailchimpService implements EmailIntegration {
  async testConnection(credentials: any): Promise<boolean> {
    try {
      const { apiKey, serverPrefix } = credentials;
      
      const response = await axios.get(`https://${serverPrefix}.api.mailchimp.com/3.0/ping`, {
        auth: {
          username: 'anystring',
          password: apiKey,
        },
      });
      
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async addSubscriber(credentials: any, subscriber: EmailSubscriber): Promise<{ id: string; success: boolean }> {
    try {
      const { apiKey, serverPrefix, audienceId } = credentials;
      
      const response = await axios.post(
        `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${audienceId}/members`,
        {
          email_address: subscriber.email,
          status: subscriber.status || 'subscribed',
          merge_fields: {
            FNAME: subscriber.firstName || '',
            LNAME: subscriber.lastName || '',
          },
          tags: subscriber.tags || [],
        },
        {
          auth: {
            username: 'anystring',
            password: apiKey,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      return {
        id: response.data.id,
        success: true,
      };
    } catch (error) {
      if (error.response?.data?.title === 'Member Exists') {
        throw new BadRequestException('Subscriber already exists in Mailchimp');
      }
      throw new BadRequestException(`Failed to add subscriber to Mailchimp: ${error.message}`);
    }
  }

  async updateSubscriber(credentials: any, subscriberId: string, subscriber: Partial<EmailSubscriber>): Promise<{ success: boolean }> {
    try {
      const { apiKey, serverPrefix, audienceId } = credentials;
      
      const updateData: any = {};
      
      if (subscriber.firstName || subscriber.lastName) {
        updateData.merge_fields = {};
        if (subscriber.firstName) updateData.merge_fields.FNAME = subscriber.firstName;
        if (subscriber.lastName) updateData.merge_fields.LNAME = subscriber.lastName;
      }
      
      if (subscriber.status) {
        updateData.status = subscriber.status;
      }
      
      await axios.patch(
        `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberId}`,
        updateData,
        {
          auth: {
            username: 'anystring',
            password: apiKey,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      return { success: true };
    } catch (error) {
      throw new BadRequestException(`Failed to update subscriber in Mailchimp: ${error.message}`);
    }
  }

  async syncTags(credentials: any, subscriberId: string, tags: string[]): Promise<{ success: boolean }> {
    try {
      const { apiKey, serverPrefix, audienceId } = credentials;
      
      const tagObjects = tags.map(tag => ({ name: tag, status: 'active' }));
      
      await axios.post(
        `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberId}/tags`,
        {
          tags: tagObjects,
        },
        {
          auth: {
            username: 'anystring',
            password: apiKey,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      return { success: true };
    } catch (error) {
      throw new BadRequestException(`Failed to sync tags in Mailchimp: ${error.message}`);
    }
  }
}

@Injectable()
export class SendGridService implements EmailIntegration {
  async testConnection(credentials: any): Promise<boolean> {
    try {
      const { apiKey } = credentials;
      
      const response = await axios.get('https://api.sendgrid.com/v3/scopes', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async addSubscriber(credentials: any, subscriber: EmailSubscriber): Promise<{ id: string; success: boolean }> {
    try {
      const { apiKey, listId } = credentials;
      
      const response = await axios.put(
        'https://api.sendgrid.com/v3/marketing/contacts',
        {
          list_ids: [listId],
          contacts: [
            {
              email: subscriber.email,
              first_name: subscriber.firstName,
              last_name: subscriber.lastName,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return {
        id: response.data.job_id,
        success: true,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to add subscriber to SendGrid: ${error.message}`);
    }
  }

  async updateSubscriber(credentials: any, subscriberId: string, subscriber: Partial<EmailSubscriber>): Promise<{ success: boolean }> {
    try {
      const { apiKey } = credentials;
      
      const updateData: any = {
        email: subscriberId,
      };
      
      if (subscriber.firstName) updateData.first_name = subscriber.firstName;
      if (subscriber.lastName) updateData.last_name = subscriber.lastName;
      
      await axios.put(
        'https://api.sendgrid.com/v3/marketing/contacts',
        {
          contacts: [updateData],
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return { success: true };
    } catch (error) {
      throw new BadRequestException(`Failed to update subscriber in SendGrid: ${error.message}`);
    }
  }

  async syncTags(credentials: any, subscriberId: string, tags: string[]): Promise<{ success: boolean }> {
    try {
      const { apiKey } = credentials;
      
      const searchResponse = await axios.post(
        'https://api.sendgrid.com/v3/marketing/contacts/search',
        {
          query: `email = '${subscriberId}'`,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (searchResponse.data.result.length === 0) {
        throw new BadRequestException('Subscriber not found in SendGrid');
      }
      
      const contactId = searchResponse.data.result[0].id;
      
      await axios.put(
        'https://api.sendgrid.com/v3/marketing/contacts',
        {
          contacts: [
            {
              email: subscriberId,
              custom_fields: {
                tags: tags.join(','),
              },
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return { success: true };
    } catch (error) {
      throw new BadRequestException(`Failed to sync tags in SendGrid: ${error.message}`);
    }
  }
}

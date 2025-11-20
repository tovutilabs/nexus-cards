import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';

export interface CRMContact {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  notes?: string;
}

export interface CRMIntegration {
  pushContact(credentials: any, contact: CRMContact): Promise<{ id: string; success: boolean }>;
  updateContact(credentials: any, contactId: string, contact: Partial<CRMContact>): Promise<{ success: boolean }>;
  getContact?(credentials: any, contactId: string): Promise<CRMContact>;
  testConnection(credentials: any): Promise<boolean>;
}

@Injectable()
export class SalesforceService implements CRMIntegration {
  async testConnection(credentials: any): Promise<boolean> {
    try {
      const { instanceUrl, accessToken } = credentials;
      
      const response = await axios.get(`${instanceUrl}/services/data/v58.0/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async pushContact(credentials: any, contact: CRMContact): Promise<{ id: string; success: boolean }> {
    try {
      const { instanceUrl, accessToken } = credentials;
      
      const response = await axios.post(
        `${instanceUrl}/services/data/v58.0/sobjects/Contact`,
        {
          FirstName: contact.firstName,
          LastName: contact.lastName,
          Email: contact.email,
          Phone: contact.phone,
          Title: contact.jobTitle,
          Company: contact.company,
          Description: contact.notes,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return {
        id: response.data.id,
        success: response.data.success,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to push contact to Salesforce: ${error.message}`);
    }
  }

  async updateContact(credentials: any, contactId: string, contact: Partial<CRMContact>): Promise<{ success: boolean }> {
    try {
      const { instanceUrl, accessToken } = credentials;
      
      const updateData: any = {};
      if (contact.firstName) updateData.FirstName = contact.firstName;
      if (contact.lastName) updateData.LastName = contact.lastName;
      if (contact.email) updateData.Email = contact.email;
      if (contact.phone) updateData.Phone = contact.phone;
      if (contact.jobTitle) updateData.Title = contact.jobTitle;
      if (contact.company) updateData.Company = contact.company;
      if (contact.notes) updateData.Description = contact.notes;
      
      await axios.patch(
        `${instanceUrl}/services/data/v58.0/sobjects/Contact/${contactId}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return { success: true };
    } catch (error) {
      throw new BadRequestException(`Failed to update contact in Salesforce: ${error.message}`);
    }
  }

  async getContact(credentials: any, contactId: string): Promise<CRMContact> {
    try {
      const { instanceUrl, accessToken } = credentials;
      
      const response = await axios.get(
        `${instanceUrl}/services/data/v58.0/sobjects/Contact/${contactId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      return {
        firstName: response.data.FirstName,
        lastName: response.data.LastName,
        email: response.data.Email,
        phone: response.data.Phone,
        company: response.data.Company,
        jobTitle: response.data.Title,
        notes: response.data.Description,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get contact from Salesforce: ${error.message}`);
    }
  }
}

@Injectable()
export class HubSpotService implements CRMIntegration {
  async testConnection(credentials: any): Promise<boolean> {
    try {
      const { accessToken } = credentials;
      
      const response = await axios.get('https://api.hubapi.com/crm/v3/objects/contacts', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: { limit: 1 },
      });
      
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async pushContact(credentials: any, contact: CRMContact): Promise<{ id: string; success: boolean }> {
    try {
      const { accessToken } = credentials;
      
      const response = await axios.post(
        'https://api.hubapi.com/crm/v3/objects/contacts',
        {
          properties: {
            firstname: contact.firstName,
            lastname: contact.lastName,
            email: contact.email,
            phone: contact.phone,
            company: contact.company,
            jobtitle: contact.jobTitle,
            notes: contact.notes,
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
        id: response.data.id,
        success: true,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to push contact to HubSpot: ${error.message}`);
    }
  }

  async updateContact(credentials: any, contactId: string, contact: Partial<CRMContact>): Promise<{ success: boolean }> {
    try {
      const { accessToken } = credentials;
      
      const properties: any = {};
      if (contact.firstName) properties.firstname = contact.firstName;
      if (contact.lastName) properties.lastname = contact.lastName;
      if (contact.email) properties.email = contact.email;
      if (contact.phone) properties.phone = contact.phone;
      if (contact.jobTitle) properties.jobtitle = contact.jobTitle;
      if (contact.company) properties.company = contact.company;
      if (contact.notes) properties.notes = contact.notes;
      
      await axios.patch(
        `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`,
        { properties },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return { success: true };
    } catch (error) {
      throw new BadRequestException(`Failed to update contact in HubSpot: ${error.message}`);
    }
  }

  async getContact(credentials: any, contactId: string): Promise<CRMContact> {
    try {
      const { accessToken } = credentials;
      
      const response = await axios.get(
        `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      const props = response.data.properties;
      return {
        firstName: props.firstname,
        lastName: props.lastname,
        email: props.email,
        phone: props.phone,
        company: props.company,
        jobTitle: props.jobtitle,
        notes: props.notes,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get contact from HubSpot: ${error.message}`);
    }
  }
}

@Injectable()
export class ZohoService implements CRMIntegration {
  async testConnection(credentials: any): Promise<boolean> {
    try {
      const { apiDomain, accessToken } = credentials;
      
      const response = await axios.get(`${apiDomain}/crm/v3/Contacts`, {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
        params: { per_page: 1 },
      });
      
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async pushContact(credentials: any, contact: CRMContact): Promise<{ id: string; success: boolean }> {
    try {
      const { apiDomain, accessToken } = credentials;
      
      const response = await axios.post(
        `${apiDomain}/crm/v3/Contacts`,
        {
          data: [
            {
              First_Name: contact.firstName,
              Last_Name: contact.lastName,
              Email: contact.email,
              Phone: contact.phone,
              Account_Name: contact.company,
              Title: contact.jobTitle,
              Description: contact.notes,
            },
          ],
        },
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return {
        id: response.data.data[0].details.id,
        success: true,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to push contact to Zoho: ${error.message}`);
    }
  }

  async updateContact(credentials: any, contactId: string, contact: Partial<CRMContact>): Promise<{ success: boolean }> {
    try {
      const { apiDomain, accessToken } = credentials;
      
      const updateData: any = {};
      if (contact.firstName) updateData.First_Name = contact.firstName;
      if (contact.lastName) updateData.Last_Name = contact.lastName;
      if (contact.email) updateData.Email = contact.email;
      if (contact.phone) updateData.Phone = contact.phone;
      if (contact.jobTitle) updateData.Title = contact.jobTitle;
      if (contact.company) updateData.Account_Name = contact.company;
      if (contact.notes) updateData.Description = contact.notes;
      
      await axios.put(
        `${apiDomain}/crm/v3/Contacts/${contactId}`,
        {
          data: [updateData],
        },
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return { success: true };
    } catch (error) {
      throw new BadRequestException(`Failed to update contact in Zoho: ${error.message}`);
    }
  }
}

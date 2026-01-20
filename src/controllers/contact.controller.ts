// controllers/contact.controller.ts
import { Request, Response } from 'express';
import { ContactService } from '../services/contact.service';

const contactService = new ContactService();

export class ContactController {
  // ============================================
  // CONTACT GROUPS
  // ============================================

  async getAllGroups(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const includeInactive = req.query.includeInactive === 'true';

      const groups = await contactService.getAllGroups(user, includeInactive);

      res.json({
        success: true,
        data: groups,
        count: groups.length,
      });
    } catch (error: any) {
      console.error('Error in getAllGroups:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to fetch contact groups',
      });
    }
  }

  async getGroupById(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      const group = await contactService.getGroupById(id, user);

      res.json({
        success: true,
        data: group,
      });
    } catch (error: any) {
      console.error('Error in getGroupById:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to fetch contact group',
      });
    }
  }

  async createGroup(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = req.body;

      const group = await contactService.createGroup(data, user);

      res.status(201).json({
        success: true,
        data: group,
        message: 'Contact group created successfully',
      });
    } catch (error: any) {
      console.error('Error in createGroup:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to create contact group',
      });
    }
  }

  async updateGroup(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const data = req.body;

      const group = await contactService.updateGroup(id, data, user);

      res.json({
        success: true,
        data: group,
        message: 'Contact group updated successfully',
      });
    } catch (error: any) {
      console.error('Error in updateGroup:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to update contact group',
      });
    }
  }

  async deleteGroup(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      await contactService.deleteGroup(id, user);

      res.json({
        success: true,
        message: 'Contact group deleted successfully',
      });
    } catch (error: any) {
      console.error('Error in deleteGroup:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to delete contact group',
      });
    }
  }

  // ============================================
  // CONTACTS
  // ============================================

  async getAllContacts(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { groupId } = req.params;
      const includeInactive = req.query.includeInactive === 'true';

      const contacts = await contactService.getAllContacts(groupId, user, includeInactive);

      res.json({
        success: true,
        data: contacts,
        count: contacts.length,
      });
    } catch (error: any) {
      console.error('Error in getAllContacts:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to fetch contacts',
      });
    }
  }

  async getContactById(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      const contact = await contactService.getContactById(id, user);

      res.json({
        success: true,
        data: contact,
      });
    } catch (error: any) {
      console.error('Error in getContactById:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to fetch contact',
      });
    }
  }

  async createContact(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { groupId } = req.params;
      const data = { ...req.body, groupId };

      const contact = await contactService.createContact(data, user);

      res.status(201).json({
        success: true,
        data: contact,
        message: 'Contact created successfully',
      });
    } catch (error: any) {
      console.error('Error in createContact:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to create contact',
      });
    }
  }

  async updateContact(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const data = req.body;

      const contact = await contactService.updateContact(id, data, user);

      res.json({
        success: true,
        data: contact,
        message: 'Contact updated successfully',
      });
    } catch (error: any) {
      console.error('Error in updateContact:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to update contact',
      });
    }
  }

  async deleteContact(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      await contactService.deleteContact(id, user);

      res.json({
        success: true,
        message: 'Contact deleted successfully',
      });
    } catch (error: any) {
      console.error('Error in deleteContact:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to delete contact',
      });
    }
  }
}
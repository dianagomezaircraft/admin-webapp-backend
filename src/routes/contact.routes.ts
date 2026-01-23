// routes/contact.routes.ts
import { Router } from 'express';
import { ContactController } from '../controllers/contact.controller';
import { authenticate } from '../middleware/auth';
import { requireEditor } from '../middleware/rbac';
import { enforceTenantIsolation } from '../middleware/tenant';

const router = Router();
const contactController = new ContactController();

// All routes require authentication
router.use(authenticate);

// ============================================
// CONTACT GROUPS ROUTES
// ============================================

/**
 * @route   GET /api/contacts/groups
 * @desc    Get all contact groups for the user's airline
 * @access  Private (Editor+)
 */
router.get('/groups',  (req, res) =>
  contactController.getAllGroups(req, res)
);

/**
 * @route   GET /api/contacts/groups/:id
 * @desc    Get contact group by ID
 * @access  Private (Editor+)
 */
router.get('/groups/:id', (req, res) =>
  contactController.getGroupById(req, res)
);

/**
 * @route   POST /api/contacts/groups
 * @desc    Create new contact group
 * @access  Private (Editor+)
 */
router.post('/groups', requireEditor, enforceTenantIsolation, (req, res) =>
  contactController.createGroup(req, res)
);

/**
 * @route   PUT /api/contacts/groups/:id
 * @desc    Update contact group
 * @access  Private (Editor+)
 */
router.put('/groups/:id', requireEditor, enforceTenantIsolation, (req, res) =>
  contactController.updateGroup(req, res)
);

/**
 * @route   DELETE /api/contacts/groups/:id
 * @desc    Delete contact group
 * @access  Private (Editor+)
 */
router.delete('/groups/:id', requireEditor, enforceTenantIsolation, (req, res) =>
  contactController.deleteGroup(req, res)
);

// ============================================
// CONTACTS ROUTES
// ============================================

/**
 * @route   GET /api/contacts/groups/:groupId/contacts
 * @desc    Get all contacts for a group
 * @access  Private (Editor+)
 */
router.get('/groups/:groupId/contacts', (req, res) =>
  contactController.getAllContacts(req, res)
);

/**
 * @route   GET /api/contacts/:id
 * @desc    Get contact by ID
 * @access  Private (Editor+)
 */
router.get('/:id',  (req, res) =>
  contactController.getContactById(req, res)
);

/**
 * @route   POST /api/contacts/groups/:groupId/contacts
 * @desc    Create new contact in a group
 * @access  Private (Editor+)
 */
router.post('/groups/:groupId/contacts', requireEditor, enforceTenantIsolation, (req, res) =>
  contactController.createContact(req, res)
);

/**
 * @route   PUT /api/contacts/:id
 * @desc    Update contact
 * @access  Private (Editor+)
 */
router.put('/:id', requireEditor, enforceTenantIsolation, (req, res) =>
  contactController.updateContact(req, res)
);

/**
 * @route   DELETE /api/contacts/:id
 * @desc    Delete contact
 * @access  Private (Editor+)
 */
router.delete('/:id', requireEditor, enforceTenantIsolation, (req, res) =>
  contactController.deleteContact(req, res)
);

export default router;
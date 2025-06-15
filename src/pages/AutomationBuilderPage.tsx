import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Save, Play, Download, Upload, Settings, Trash2, Copy, 
  Edit, Search, Filter, Grid, List, RefreshCw, ArrowRight, 
  ChevronDown, ChevronRight, Zap, Store, Package, FileText, 
  Image, Type, Database, Globe, Send, MessageSquare, Mail, 
  AlertTriangle, CheckCircle, X, Move, MoreHorizontal
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

// Workflow types
interface ModuleConnection {
  sourceId: string;
  targetId: string;
  sourceHandle?: string;
  targetHandle?: string;
}

interface ModuleData {
  id: string;
  type: string;
  name: string;
  position: { x: number; y: number };
  data: Record<string, any>;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
}

interface Workflow {
  id?: string;
  name: string;
  description?: string;
  modules: ModuleData[];
  connections: ModuleConnection[];
  created_at?: string;
  updated_at?: string;
}

// Module type definitions
interface ModuleType {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  inputs: { id: string; name: string; type: string; required: boolean }[];
  outputs: { id: string; name: string; type: string }[];
  configFields: { id: string; name: string; type: string; required: boolean; options?: string[] }[];
}

const AutomationBuilderPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showModulePanel, setShowModulePanel] = useState(true);
  const [selectedModule, setSelectedModule] = useState<ModuleData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedModule, setDraggedModule] = useState<ModuleType | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isCreatingConnection, setIsCreatingConnection] = useState(false);
  const [connectionStart, setConnectionStart] = useState<{ moduleId: string, outputId: string } | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isRunning, setIsRunning] = useState(false);
  const [runResults, setRunResults] = useState<any>(null);
  const [showRunResults, setShowRunResults] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const moduleRefs = useRef<Record<string, HTMLDivElement>>({});

  // Module types
  const moduleTypes: ModuleType[] = [
    {
      id: 'etsy-search',
      name: 'Etsy Search',
      category: 'etsy',
      description: 'Search for products on Etsy',
      icon: <Globe className="h-5 w-5" />,
      color: 'bg-orange-500',
      inputs: [],
      outputs: [{ id: 'products', name: 'Products', type: 'array' }],
      configFields: [
        { id: 'query', name: 'Search Query', type: 'string', required: true },
        { id: 'limit', name: 'Result Limit', type: 'number', required: false }
      ]
    },
    {
      id: 'etsy-get-listing',
      name: 'Etsy Get Listing',
      category: 'etsy',
      description: 'Get details of an Etsy listing',
      icon: <Package className="h-5 w-5" />,
      color: 'bg-orange-500',
      inputs: [{ id: 'listing_id', name: 'Listing ID', type: 'string', required: true }],
      outputs: [{ id: 'listing', name: 'Listing', type: 'object' }],
      configFields: []
    },
    {
      id: 'etsy-create-listing',
      name: 'Etsy Create Listing',
      category: 'etsy',
      description: 'Create a new listing on Etsy',
      icon: <Plus className="h-5 w-5" />,
      color: 'bg-orange-500',
      inputs: [
        { id: 'title', name: 'Title', type: 'string', required: true },
        { id: 'description', name: 'Description', type: 'string', required: true },
        { id: 'price', name: 'Price', type: 'number', required: true },
        { id: 'images', name: 'Images', type: 'array', required: true }
      ],
      outputs: [{ id: 'created_listing', name: 'Created Listing', type: 'object' }],
      configFields: [
        { id: 'shop_id', name: 'Shop ID', type: 'string', required: true },
        { id: 'quantity', name: 'Quantity', type: 'number', required: false },
        { id: 'tags', name: 'Tags', type: 'array', required: false }
      ]
    },
    {
      id: 'text-generator',
      name: 'Text Generator',
      category: 'ai',
      description: 'Generate text using AI',
      icon: <MessageSquare className="h-5 w-5" />,
      color: 'bg-purple-500',
      inputs: [
        { id: 'prompt', name: 'Prompt', type: 'string', required: true }
      ],
      outputs: [{ id: 'generated_text', name: 'Generated Text', type: 'string' }],
      configFields: [
        { id: 'model', name: 'AI Model', type: 'select', required: true, options: ['gpt-3.5-turbo', 'gpt-4'] },
        { id: 'max_tokens', name: 'Max Tokens', type: 'number', required: false }
      ]
    },
    {
      id: 'image-generator',
      name: 'Image Generator',
      category: 'ai',
      description: 'Generate images using AI',
      icon: <Image className="h-5 w-5" />,
      color: 'bg-purple-500',
      inputs: [
        { id: 'prompt', name: 'Prompt', type: 'string', required: true }
      ],
      outputs: [{ id: 'generated_image', name: 'Generated Image', type: 'string' }],
      configFields: [
        { id: 'model', name: 'AI Model', type: 'select', required: true, options: ['dall-e-2', 'dall-e-3'] },
        { id: 'size', name: 'Image Size', type: 'select', required: false, options: ['256x256', '512x512', '1024x1024'] }
      ]
    },
    {
      id: 'filter',
      name: 'Filter',
      category: 'logic',
      description: 'Filter items based on conditions',
      icon: <Filter className="h-5 w-5" />,
      color: 'bg-blue-500',
      inputs: [{ id: 'items', name: 'Items', type: 'array', required: true }],
      outputs: [{ id: 'filtered_items', name: 'Filtered Items', type: 'array' }],
      configFields: [
        { id: 'condition', name: 'Condition', type: 'string', required: true },
        { id: 'field', name: 'Field', type: 'string', required: true },
        { id: 'value', name: 'Value', type: 'string', required: true }
      ]
    },
    {
      id: 'mapper',
      name: 'Mapper',
      category: 'logic',
      description: 'Map data from one format to another',
      icon: <ArrowRight className="h-5 w-5" />,
      color: 'bg-blue-500',
      inputs: [{ id: 'input', name: 'Input', type: 'any', required: true }],
      outputs: [{ id: 'output', name: 'Output', type: 'any' }],
      configFields: [
        { id: 'mapping', name: 'Mapping', type: 'object', required: true }
      ]
    },
    {
      id: 'email-sender',
      name: 'Email Sender',
      category: 'notifications',
      description: 'Send email notifications',
      icon: <Mail className="h-5 w-5" />,
      color: 'bg-green-500',
      inputs: [
        { id: 'to', name: 'To', type: 'string', required: true },
        { id: 'subject', name: 'Subject', type: 'string', required: true },
        { id: 'body', name: 'Body', type: 'string', required: true }
      ],
      outputs: [{ id: 'result', name: 'Result', type: 'object' }],
      configFields: [
        { id: 'from', name: 'From', type: 'string', required: true }
      ]
    },
    {
      id: 'database-query',
      name: 'Database Query',
      category: 'database',
      description: 'Query the database',
      icon: <Database className="h-5 w-5" />,
      color: 'bg-yellow-500',
      inputs: [
        { id: 'query_params', name: 'Query Parameters', type: 'object', required: false }
      ],
      outputs: [{ id: 'results', name: 'Results', type: 'array' }],
      configFields: [
        { id: 'table', name: 'Table', type: 'string', required: true },
        { id: 'query_type', name: 'Query Type', type: 'select', required: true, options: ['select', 'insert', 'update', 'delete'] }
      ]
    },
    {
      id: 'database-insert',
      name: 'Database Insert',
      category: 'database',
      description: 'Insert data into the database',
      icon: <Database className="h-5 w-5" />,
      color: 'bg-yellow-500',
      inputs: [
        { id: 'data', name: 'Data', type: 'object', required: true }
      ],
      outputs: [{ id: 'result', name: 'Result', type: 'object' }],
      configFields: [
        { id: 'table', name: 'Table', type: 'string', required: true }
      ]
    },
    {
      id: 'webhook',
      name: 'Webhook',
      category: 'triggers',
      description: 'Trigger workflow from external webhook',
      icon: <Zap className="h-5 w-5" />,
      color: 'bg-indigo-500',
      inputs: [],
      outputs: [{ id: 'payload', name: 'Payload', type: 'object' }],
      configFields: [
        { id: 'path', name: 'Path', type: 'string', required: true }
      ]
    },
    {
      id: 'schedule',
      name: 'Schedule',
      category: 'triggers',
      description: 'Trigger workflow on a schedule',
      icon: <Clock className="h-5 w-5" />,
      color: 'bg-indigo-500',
      inputs: [],
      outputs: [{ id: 'timestamp', name: 'Timestamp', type: 'string' }],
      configFields: [
        { id: 'cron', name: 'Cron Expression', type: 'string', required: true },
        { id: 'timezone', name: 'Timezone', type: 'string', required: false }
      ]
    }
  ];

  // Load workflows on component mount
  useEffect(() => {
    if (user) {
      loadWorkflows();
    }
  }, [user]);

  // Load saved workflows
  const loadWorkflows = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, this would fetch from Supabase
      // For now, we'll use mock data
      const mockWorkflows: Workflow[] = [
        {
          id: '1',
          name: 'Etsy Product Search and Filter',
          description: 'Search for products on Etsy and filter by price',
          modules: [
            {
              id: 'module-1',
              type: 'etsy-search',
              name: 'Etsy Search',
              position: { x: 100, y: 100 },
              data: { query: 'vintage poster', limit: 10 }
            },
            {
              id: 'module-2',
              type: 'filter',
              name: 'Price Filter',
              position: { x: 400, y: 100 },
              data: { condition: 'greater_than', field: 'price', value: '10' }
            }
          ],
          connections: [
            {
              sourceId: 'module-1',
              targetId: 'module-2',
              sourceHandle: 'products',
              targetHandle: 'items'
            }
          ],
          created_at: '2023-01-15T10:30:00Z',
          updated_at: '2023-01-20T14:22:00Z'
        },
        {
          id: '2',
          name: 'AI Product Description Generator',
          description: 'Generate product descriptions using AI',
          modules: [
            {
              id: 'module-1',
              type: 'text-generator',
              name: 'AI Text Generator',
              position: { x: 100, y: 100 },
              data: { model: 'gpt-4', prompt: 'Write a product description for {{product_name}}' }
            },
            {
              id: 'module-2',
              type: 'database-insert',
              name: 'Save to Database',
              position: { x: 400, y: 100 },
              data: { table: 'product_descriptions' }
            }
          ],
          connections: [
            {
              sourceId: 'module-1',
              targetId: 'module-2',
              sourceHandle: 'generated_text',
              targetHandle: 'data'
            }
          ],
          created_at: '2023-02-10T09:15:00Z',
          updated_at: '2023-02-18T16:45:00Z'
        }
      ];
      
      setWorkflows(mockWorkflows);
    } catch (error) {
      console.error('Error loading workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create a new workflow
  const createNewWorkflow = () => {
    setCurrentWorkflow({
      name: 'New Workflow',
      modules: [],
      connections: []
    });
    setWorkflowName('New Workflow');
    setWorkflowDescription('');
    setIsEditing(true);
  };

  // Edit an existing workflow
  const editWorkflow = (workflow: Workflow) => {
    setCurrentWorkflow(workflow);
    setWorkflowName(workflow.name);
    setWorkflowDescription(workflow.description || '');
    setIsEditing(true);
  };

  // Delete a workflow
  const deleteWorkflow = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this workflow?')) return;

    try {
      // In a real implementation, this would delete from Supabase
      setWorkflows(prev => prev.filter(w => w.id !== id));
    } catch (error) {
      console.error('Error deleting workflow:', error);
    }
  };

  // Duplicate a workflow
  const duplicateWorkflow = (workflow: Workflow) => {
    const newWorkflow = {
      ...workflow,
      id: undefined,
      name: `${workflow.name} (Copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setWorkflows(prev => [...prev, { ...newWorkflow, id: `temp-${Date.now()}` }]);
  };

  // Save the current workflow
  const saveWorkflow = async () => {
    if (!currentWorkflow) return;
    
    try {
      const updatedWorkflow = {
        ...currentWorkflow,
        name: workflowName,
        description: workflowDescription,
        updated_at: new Date().toISOString()
      };
      
      if (currentWorkflow.id) {
        // Update existing workflow
        setWorkflows(prev => prev.map(w => w.id === currentWorkflow.id ? updatedWorkflow : w));
      } else {
        // Create new workflow
        const newWorkflow = {
          ...updatedWorkflow,
          id: `workflow-${Date.now()}`,
          created_at: new Date().toISOString()
        };
        setWorkflows(prev => [...prev, newWorkflow]);
      }
      
      setShowSaveDialog(false);
      setIsEditing(false);
      setCurrentWorkflow(null);
    } catch (error) {
      console.error('Error saving workflow:', error);
    }
  };

  // Handle module drag start
  const handleModuleDragStart = (e: React.DragEvent, moduleType: ModuleType) => {
    e.dataTransfer.setData('moduleType', JSON.stringify(moduleType));
    setIsDragging(true);
    setDraggedModule(moduleType);
  };

  // Handle module drag end
  const handleModuleDragEnd = () => {
    setIsDragging(false);
    setDraggedModule(null);
  };

  // Handle drag over on canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setDragPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  // Handle drop on canvas
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const moduleTypeData = e.dataTransfer.getData('moduleType');
    
    if (moduleTypeData && canvasRef.current) {
      const moduleType = JSON.parse(moduleTypeData) as ModuleType;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      addModule(moduleType, { x, y });
    }
    
    setIsDragging(false);
    setDraggedModule(null);
  };

  // Add a module to the workflow
  const addModule = (moduleType: ModuleType, position: { x: number; y: number }) => {
    if (!currentWorkflow) return;
    
    const newModule: ModuleData = {
      id: `module-${Date.now()}`,
      type: moduleType.id,
      name: moduleType.name,
      position,
      data: {}
    };
    
    setCurrentWorkflow(prev => {
      if (!prev) return null;
      return {
        ...prev,
        modules: [...prev.modules, newModule]
      };
    });
  };

  // Remove a module from the workflow
  const removeModule = (moduleId: string) => {
    if (!currentWorkflow) return;
    
    setCurrentWorkflow(prev => {
      if (!prev) return null;
      return {
        ...prev,
        modules: prev.modules.filter(m => m.id !== moduleId),
        connections: prev.connections.filter(c => c.sourceId !== moduleId && c.targetId !== moduleId)
      };
    });
    
    if (selectedModule?.id === moduleId) {
      setSelectedModule(null);
    }
  };

  // Handle module selection
  const handleModuleSelect = (module: ModuleData) => {
    setSelectedModule(module);
  };

  // Update module position
  const updateModulePosition = (moduleId: string, position: { x: number; y: number }) => {
    if (!currentWorkflow) return;
    
    setCurrentWorkflow(prev => {
      if (!prev) return null;
      return {
        ...prev,
        modules: prev.modules.map(m => 
          m.id === moduleId ? { ...m, position } : m
        )
      };
    });
  };

  // Update module data
  const updateModuleData = (moduleId: string, data: Record<string, any>) => {
    if (!currentWorkflow) return;
    
    setCurrentWorkflow(prev => {
      if (!prev) return null;
      return {
        ...prev,
        modules: prev.modules.map(m => 
          m.id === moduleId ? { ...m, data: { ...m.data, ...data } } : m
        )
      };
    });
    
    if (selectedModule?.id === moduleId) {
      setSelectedModule(prev => prev ? { ...prev, data: { ...prev.data, ...data } } : null);
    }
  };

  // Start creating a connection
  const startConnection = (moduleId: string, outputId: string) => {
    setIsCreatingConnection(true);
    setConnectionStart({ moduleId, outputId });
  };

  // Complete a connection
  const completeConnection = (moduleId: string, inputId: string) => {
    if (!isCreatingConnection || !connectionStart || !currentWorkflow) return;
    
    // Check if source and target are different modules
    if (connectionStart.moduleId === moduleId) {
      setIsCreatingConnection(false);
      setConnectionStart(null);
      return;
    }
    
    // Check if connection already exists
    const connectionExists = currentWorkflow.connections.some(
      c => c.sourceId === connectionStart.moduleId && 
           c.targetId === moduleId &&
           c.sourceHandle === connectionStart.outputId &&
           c.targetHandle === inputId
    );
    
    if (connectionExists) {
      setIsCreatingConnection(false);
      setConnectionStart(null);
      return;
    }
    
    // Add the new connection
    const newConnection: ModuleConnection = {
      sourceId: connectionStart.moduleId,
      targetId: moduleId,
      sourceHandle: connectionStart.outputId,
      targetHandle: inputId
    };
    
    setCurrentWorkflow(prev => {
      if (!prev) return null;
      return {
        ...prev,
        connections: [...prev.connections, newConnection]
      };
    });
    
    setIsCreatingConnection(false);
    setConnectionStart(null);
  };

  // Remove a connection
  const removeConnection = (sourceId: string, targetId: string, sourceHandle?: string, targetHandle?: string) => {
    if (!currentWorkflow) return;
    
    setCurrentWorkflow(prev => {
      if (!prev) return null;
      return {
        ...prev,
        connections: prev.connections.filter(c => 
          !(c.sourceId === sourceId && 
            c.targetId === targetId && 
            (sourceHandle ? c.sourceHandle === sourceHandle : true) && 
            (targetHandle ? c.targetHandle === targetHandle : true))
        )
      };
    });
  };

  // Run the workflow
  const runWorkflow = async () => {
    if (!currentWorkflow) return;
    
    setIsRunning(true);
    
    try {
      // Simulate workflow execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock results
      const results = {
        success: true,
        executionTime: '2.3 seconds',
        moduleResults: currentWorkflow.modules.map(module => ({
          id: module.id,
          name: module.name,
          type: module.type,
          status: 'success',
          executionTime: `${(Math.random() * 2).toFixed(1)} seconds`,
          output: module.type === 'etsy-search' 
            ? { count: 10, message: 'Found 10 products matching the query' }
            : module.type === 'filter'
            ? { count: 5, message: 'Filtered to 5 products' }
            : module.type === 'text-generator'
            ? { text: 'Generated product description...', tokens: 150 }
            : { message: 'Module executed successfully' }
        }))
      };
      
      setRunResults(results);
      setShowRunResults(true);
    } catch (error) {
      console.error('Error running workflow:', error);
      
      setRunResults({
        success: false,
        error: 'Workflow execution failed',
        details: error.message
      });
      
      setShowRunResults(true);
    } finally {
      setIsRunning(false);
    }
  };

  // Get module type by ID
  const getModuleTypeById = (typeId: string): ModuleType | undefined => {
    return moduleTypes.find(type => type.id === typeId);
  };

  // Filter module types by category
  const filteredModuleTypes = moduleTypes.filter(type => 
    (selectedCategory === 'all' || type.category === selectedCategory) &&
    type.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group module types by category
  const moduleTypesByCategory = moduleTypes.reduce((acc, type) => {
    if (!acc[type.category]) {
      acc[type.category] = [];
    }
    acc[type.category].push(type);
    return acc;
  }, {} as Record<string, ModuleType[]>);

  // Get category counts
  const categoryCounts = Object.entries(moduleTypesByCategory).reduce((acc, [category, types]) => {
    acc[category] = types.length;
    return acc;
  }, { all: moduleTypes.length } as Record<string, number>);

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render connection lines
  const renderConnections = () => {
    if (!currentWorkflow) return null;
    
    return currentWorkflow.connections.map((connection, index) => {
      const sourceModule = currentWorkflow.modules.find(m => m.id === connection.sourceId);
      const targetModule = currentWorkflow.modules.find(m => m.id === connection.targetId);
      
      if (!sourceModule || !targetModule) return null;
      
      const sourceRef = moduleRefs.current[connection.sourceId];
      const targetRef = moduleRefs.current[connection.targetId];
      
      if (!sourceRef || !targetRef) return null;
      
      const sourceRect = sourceRef.getBoundingClientRect();
      const targetRect = targetRef.getBoundingClientRect();
      
      if (!canvasRef.current) return null;
      
      const canvasRect = canvasRef.current.getBoundingClientRect();
      
      // Calculate connection points
      const sourceX = sourceModule.position.x + sourceRect.width;
      const sourceY = sourceModule.position.y + sourceRect.height / 2;
      const targetX = targetModule.position.x;
      const targetY = targetModule.position.y + targetRect.height / 2;
      
      // Calculate control points for the curve
      const dx = Math.abs(targetX - sourceX);
      const controlPointX = dx / 2;
      
      return (
        <svg 
          key={`connection-${index}`}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ zIndex: 10 }}
        >
          <path
            d={`M ${sourceX} ${sourceY} C ${sourceX + controlPointX} ${sourceY}, ${targetX - controlPointX} ${targetY}, ${targetX} ${targetY}`}
            stroke="#6366F1"
            strokeWidth="2"
            fill="none"
            markerEnd="url(#arrowhead)"
          />
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#6366F1" />
            </marker>
          </defs>
        </svg>
      );
    });
  };

  // Render the active connection being created
  const renderActiveConnection = () => {
    if (!isCreatingConnection || !connectionStart) return null;
    
    const sourceModule = currentWorkflow?.modules.find(m => m.id === connectionStart.moduleId);
    if (!sourceModule) return null;
    
    const sourceRef = moduleRefs.current[connectionStart.moduleId];
    if (!sourceRef || !canvasRef.current) return null;
    
    const sourceRect = sourceRef.getBoundingClientRect();
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    const sourceX = sourceModule.position.x + sourceRect.width;
    const sourceY = sourceModule.position.y + sourceRect.height / 2;
    
    // Use mouse position for the target
    const targetX = dragPosition.x;
    const targetY = dragPosition.y;
    
    // Calculate control points for the curve
    const dx = Math.abs(targetX - sourceX);
    const controlPointX = dx / 2;
    
    return (
      <svg 
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ zIndex: 20 }}
      >
        <path
          d={`M ${sourceX} ${sourceY} C ${sourceX + controlPointX} ${sourceY}, ${targetX - controlPointX} ${targetY}, ${targetX} ${targetY}`}
          stroke="#6366F1"
          strokeWidth="2"
          strokeDasharray="5,5"
          fill="none"
        />
      </svg>
    );
  };

  // Render a module on the canvas
  const renderModule = (module: ModuleData) => {
    const moduleType = getModuleTypeById(module.type);
    if (!moduleType) return null;
    
    const isSelected = selectedModule?.id === module.id;
    
    return (
      <div
        key={module.id}
        ref={el => { if (el) moduleRefs.current[module.id] = el; }}
        className={`absolute bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 transition-all ${
          isSelected ? 'border-indigo-500' : 'border-gray-200 dark:border-gray-700'
        }`}
        style={{
          left: `${module.position.x}px`,
          top: `${module.position.y}px`,
          width: '220px',
          zIndex: isSelected ? 30 : 20
        }}
        onClick={() => handleModuleSelect(module)}
        onMouseDown={e => {
          // Start dragging the module
          e.stopPropagation();
          
          const startX = e.clientX;
          const startY = e.clientY;
          const startPosX = module.position.x;
          const startPosY = module.position.y;
          
          const handleMouseMove = (e: MouseEvent) => {
            if (!canvasRef.current) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            const newX = Math.max(0, startPosX + dx);
            const newY = Math.max(0, startPosY + dy);
            
            updateModulePosition(module.id, { x: newX, y: newY });
          };
          
          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };
          
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
      >
        {/* Module Header */}
        <div className={`p-3 rounded-t-lg flex items-center justify-between ${moduleType.color} text-white`}>
          <div className="flex items-center space-x-2">
            {moduleType.icon}
            <span className="font-medium">{module.name}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeModule(module.id);
            }}
            className="text-white hover:text-red-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Module Body */}
        <div className="p-3">
          {/* Input Connectors */}
          {moduleType.inputs.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Inputs</div>
              <div className="space-y-1">
                {moduleType.inputs.map(input => (
                  <div 
                    key={input.id}
                    className="flex items-center justify-between"
                  >
                    <div 
                      className={`w-3 h-3 rounded-full border-2 cursor-pointer ${
                        isCreatingConnection 
                          ? 'border-indigo-500 bg-indigo-200' 
                          : 'border-gray-400 bg-white dark:bg-gray-700'
                      }`}
                      onClick={() => {
                        if (isCreatingConnection && connectionStart) {
                          completeConnection(module.id, input.id);
                        }
                      }}
                    />
                    <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 ml-2">
                      {input.name}
                      {input.required && <span className="text-red-500">*</span>}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{input.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Configuration Preview */}
          <div className="mb-3">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Configuration</div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-2 text-xs text-gray-700 dark:text-gray-300">
              {Object.entries(module.data).length > 0 ? (
                <div className="space-y-1">
                  {Object.entries(module.data).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span>{key}:</span>
                      <span className="font-medium truncate max-w-[100px]">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">No configuration</span>
              )}
            </div>
          </div>
          
          {/* Output Connectors */}
          {moduleType.outputs.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Outputs</div>
              <div className="space-y-1">
                {moduleType.outputs.map(output => (
                  <div 
                    key={output.id}
                    className="flex items-center justify-between"
                  >
                    <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 mr-2">{output.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">{output.type}</span>
                    <div 
                      className="w-3 h-3 rounded-full border-2 border-gray-400 bg-white dark:bg-gray-700 cursor-pointer"
                      onClick={() => startConnection(module.id, output.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // If loading
  if (loading && !isEditing) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  // Workflow editor view
  if (isEditing && currentWorkflow) {
    return (
      <div className="h-screen flex flex-col">
        {/* Editor Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => {
                  if (window.confirm('Değişiklikleriniz kaydedilmeyecek. Devam etmek istiyor musunuz?')) {
                    setIsEditing(false);
                    setCurrentWorkflow(null);
                  }
                }}
                variant="secondary"
                size="sm"
              >
                ← Geri
              </Button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {currentWorkflow.name}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => setShowSaveDialog(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Kaydet
              </Button>
              <Button 
                onClick={runWorkflow}
                disabled={isRunning || currentWorkflow.modules.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isRunning ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Çalıştır
              </Button>
            </div>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Module Panel */}
          <div className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 ${
            showModulePanel ? 'w-72' : 'w-12'
          } transition-all duration-300 flex flex-col`}>
            {showModulePanel ? (
              <>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Modül ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                </div>
                
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Kategoriler</div>
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                        selectedCategory === 'all'
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      Tüm Modüller ({categoryCounts.all})
                    </button>
                    {Object.entries(moduleTypesByCategory).map(([category, modules]) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                          selectedCategory === category
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)} ({modules.length})
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {selectedCategory === 'all' ? 'Tüm Modüller' : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
                  </div>
                  <div className="space-y-2">
                    {filteredModuleTypes.map(moduleType => (
                      <div
                        key={moduleType.id}
                        className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 cursor-move hover:shadow-md transition-shadow"
                        draggable
                        onDragStart={(e) => handleModuleDragStart(e, moduleType)}
                        onDragEnd={handleModuleDragEnd}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg ${moduleType.color} flex items-center justify-center text-white`}>
                            {moduleType.icon}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white text-sm">{moduleType.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{moduleType.description}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {filteredModuleTypes.length === 0 && (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        Modül bulunamadı
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-4">
                <button
                  onClick={() => setShowModulePanel(true)}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
            
            {showModulePanel && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowModulePanel(false)}
                  className="w-full py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center justify-center"
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span className="ml-2">Gizle</span>
                </button>
              </div>
            )}
          </div>

          {/* Canvas */}
          <div className="flex-1 relative bg-gray-100 dark:bg-gray-900 overflow-auto">
            <div
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => setSelectedModule(null)}
              style={{ minWidth: '2000px', minHeight: '2000px' }}
            >
              {/* Grid Background */}
              <div className="absolute inset-0 bg-grid-pattern" />
              
              {/* Modules */}
              {currentWorkflow.modules.map(module => renderModule(module))}
              
              {/* Connections */}
              {renderConnections()}
              
              {/* Active Connection */}
              {renderActiveConnection()}
              
              {/* Drag Preview */}
              {isDragging && draggedModule && (
                <div
                  className="absolute pointer-events-none bg-white dark:bg-gray-800 border-2 border-indigo-500 rounded-lg shadow-lg opacity-70"
                  style={{
                    left: `${dragPosition.x - 110}px`,
                    top: `${dragPosition.y - 30}px`,
                    width: '220px'
                  }}
                >
                  <div className={`p-3 rounded-t-lg flex items-center ${draggedModule.color} text-white`}>
                    {draggedModule.icon}
                    <span className="ml-2 font-medium">{draggedModule.name}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Properties Panel */}
          {selectedModule && (
            <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Modül Özellikleri</h2>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Module Type Info */}
                {(() => {
                  const moduleType = getModuleTypeById(selectedModule.type);
                  if (!moduleType) return null;
                  
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg ${moduleType.color} flex items-center justify-center text-white`}>
                          {moduleType.icon}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{moduleType.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{moduleType.description}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                
                {/* Module Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Modül Adı
                  </label>
                  <Input
                    value={selectedModule.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setSelectedModule(prev => prev ? { ...prev, name: newName } : null);
                      setCurrentWorkflow(prev => {
                        if (!prev) return null;
                        return {
                          ...prev,
                          modules: prev.modules.map(m => 
                            m.id === selectedModule.id ? { ...m, name: newName } : m
                          )
                        };
                      });
                    }}
                    className="w-full"
                  />
                </div>
                
                {/* Module Configuration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Konfigürasyon
                  </label>
                  
                  {(() => {
                    const moduleType = getModuleTypeById(selectedModule.type);
                    if (!moduleType) return null;
                    
                    return (
                      <div className="space-y-3">
                        {moduleType.configFields.map(field => (
                          <div key={field.id}>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              {field.name}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            
                            {field.type === 'select' ? (
                              <select
                                value={selectedModule.data[field.id] || ''}
                                onChange={(e) => updateModuleData(selectedModule.id, { [field.id]: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                              >
                                <option value="">Seçiniz...</option>
                                {field.options?.map(option => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            ) : field.type === 'number' ? (
                              <Input
                                type="number"
                                value={selectedModule.data[field.id] || ''}
                                onChange={(e) => updateModuleData(selectedModule.id, { [field.id]: e.target.value })}
                                className="w-full"
                              />
                            ) : (
                              <Input
                                type="text"
                                value={selectedModule.data[field.id] || ''}
                                onChange={(e) => updateModuleData(selectedModule.id, { [field.id]: e.target.value })}
                                className="w-full"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                
                {/* Module Connections */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bağlantılar
                  </label>
                  
                  {(() => {
                    if (!currentWorkflow) return null;
                    
                    const incomingConnections = currentWorkflow.connections.filter(c => c.targetId === selectedModule.id);
                    const outgoingConnections = currentWorkflow.connections.filter(c => c.sourceId === selectedModule.id);
                    
                    if (incomingConnections.length === 0 && outgoingConnections.length === 0) {
                      return (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Bu modül için bağlantı yok
                        </div>
                      );
                    }
                    
                    return (
                      <div className="space-y-3">
                        {incomingConnections.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Gelen Bağlantılar
                            </div>
                            <div className="space-y-1">
                              {incomingConnections.map((connection, index) => {
                                const sourceModule = currentWorkflow.modules.find(m => m.id === connection.sourceId);
                                if (!sourceModule) return null;
                                
                                return (
                                  <div key={`in-${index}`} className="flex items-center justify-between text-xs">
                                    <span className="text-gray-700 dark:text-gray-300">
                                      {sourceModule.name} → {selectedModule.name}
                                    </span>
                                    <button
                                      onClick={() => removeConnection(connection.sourceId, connection.targetId, connection.sourceHandle, connection.targetHandle)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {outgoingConnections.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Giden Bağlantılar
                            </div>
                            <div className="space-y-1">
                              {outgoingConnections.map((connection, index) => {
                                const targetModule = currentWorkflow.modules.find(m => m.id === connection.targetId);
                                if (!targetModule) return null;
                                
                                return (
                                  <div key={`out-${index}`} className="flex items-center justify-between text-xs">
                                    <span className="text-gray-700 dark:text-gray-300">
                                      {selectedModule.name} → {targetModule.name}
                                    </span>
                                    <button
                                      onClick={() => removeConnection(connection.sourceId, connection.targetId, connection.sourceHandle, connection.targetHandle)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
                
                {/* Delete Button */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    onClick={() => removeModule(selectedModule.id)}
                    variant="danger"
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Modülü Sil
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Dialog */}
        {showSaveDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  İş Akışını Kaydet
                </h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    İş Akışı Adı
                  </label>
                  <Input
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Açıklama
                  </label>
                  <textarea
                    value={workflowDescription}
                    onChange={(e) => setWorkflowDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    onClick={saveWorkflow}
                    className="flex-1"
                    disabled={!workflowName.trim()}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Kaydet
                  </Button>
                  <Button
                    onClick={() => setShowSaveDialog(false)}
                    variant="secondary"
                    className="flex-1"
                  >
                    İptal
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Run Results Dialog */}
        {showRunResults && runResults && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  {runResults.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  İş Akışı Çalıştırma Sonuçları
                </h2>
                <button
                  onClick={() => setShowRunResults(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {runResults.success ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <h3 className="text-sm font-medium text-green-700 dark:text-green-400">
                            İş Akışı Başarıyla Tamamlandı
                          </h3>
                          <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                            Toplam çalışma süresi: {runResults.executionTime}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                        Modül Sonuçları
                      </h3>
                      <div className="space-y-3">
                        {runResults.moduleResults.map((result: any, index: number) => (
                          <div 
                            key={index}
                            className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <h4 className="font-medium text-gray-900 dark:text-white">{result.name}</h4>
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {result.executionTime}
                              </span>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 text-sm">
                              <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 text-xs">
                                {JSON.stringify(result.output, null, 2)}
                              </pre>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <div>
                          <h3 className="text-sm font-medium text-red-700 dark:text-red-400">
                            İş Akışı Çalıştırma Hatası
                          </h3>
                          <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                            {runResults.error}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {runResults.details && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded p-4 text-sm text-gray-700 dark:text-gray-300">
                        <h4 className="font-medium mb-2">Hata Detayları:</h4>
                        <pre className="whitespace-pre-wrap text-xs">
                          {runResults.details}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={() => setShowRunResults(false)}
                  className="w-full"
                >
                  Kapat
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Workflows list view
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Zap className="h-6 w-6 mr-2 text-orange-500" />
            İş Akışı Otomasyonları
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Make.com benzeri modüler iş akışları oluşturun ve yönetin
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button
            onClick={createNewWorkflow}
            className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Yeni İş Akışı</span>
          </Button>
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Zap className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">
              ⚡ Modüler İş Akışı Otomasyonu
            </h3>
            <p className="text-sm text-blue-600 dark:text-blue-300">
              Make.com benzeri sürükle-bırak arayüzü ile görsel iş akışları oluşturun. Modülleri birbirine bağlayarak karmaşık otomasyonlar tasarlayın.
              <br />
              <strong>Özellikler:</strong> Etsy API entegrasyonu, AI metin ve görsel oluşturma, veri filtreleme, veritabanı işlemleri ve daha fazlası.
              <br />
              <strong>Kullanım:</strong> Modülleri sürükleyip bırakın, bağlantılar oluşturun ve iş akışınızı çalıştırın.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="text"
            placeholder="İş akışı ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400'} rounded-l-lg`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400'} rounded-r-lg`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Workflows Display */}
      {workflows.length === 0 ? (
        <div className="text-center py-12">
          <Zap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Henüz İş Akışı Yok
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            İlk iş akışınızı oluşturarak otomasyonlara başlayın
          </p>
          <Button
            onClick={createNewWorkflow}
            className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2 mx-auto"
          >
            <Plus className="h-4 w-4" />
            <span>İlk İş Akışını Oluştur</span>
          </Button>
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workflows
                .filter(workflow => workflow.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((workflow) => (
                  <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{workflow.name}</CardTitle>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => editWorkflow(workflow)}
                            className="text-blue-500 hover:text-blue-700 p-1"
                            title="Düzenle"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => duplicateWorkflow(workflow)}
                            className="text-green-500 hover:text-green-700 p-1"
                            title="Çoğalt"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteWorkflow(workflow.id!)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Workflow Preview */}
                        <div 
                          className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 h-32 relative overflow-hidden cursor-pointer"
                          onClick={() => editWorkflow(workflow)}
                        >
                          {workflow.modules.length > 0 ? (
                            <div className="absolute inset-0">
                              {/* Simple preview of modules */}
                              {workflow.modules.map((module, index) => {
                                const moduleType = getModuleTypeById(module.type);
                                if (!moduleType) return null;
                                
                                // Scale down for preview
                                const scale = 0.3;
                                const x = module.position.x * scale;
                                const y = module.position.y * scale;
                                
                                return (
                                  <div
                                    key={module.id}
                                    className={`absolute rounded-md ${moduleType.color} text-white text-xs p-1`}
                                    style={{
                                      left: `${x}px`,
                                      top: `${y}px`,
                                      width: '60px',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}
                                  >
                                    {module.name}
                                  </div>
                                );
                              })}
                              
                              {/* Simple preview of connections */}
                              {workflow.connections.map((connection, index) => {
                                const sourceModule = workflow.modules.find(m => m.id === connection.sourceId);
                                const targetModule = workflow.modules.find(m => m.id === connection.targetId);
                                
                                if (!sourceModule || !targetModule) return null;
                                
                                // Scale down for preview
                                const scale = 0.3;
                                const sourceX = (sourceModule.position.x + 60) * scale;
                                const sourceY = (sourceModule.position.y + 10) * scale;
                                const targetX = targetModule.position.x * scale;
                                const targetY = (targetModule.position.y + 10) * scale;
                                
                                return (
                                  <svg 
                                    key={`preview-connection-${index}`}
                                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                                  >
                                    <line
                                      x1={sourceX}
                                      y1={sourceY}
                                      x2={targetX}
                                      y2={targetY}
                                      stroke="#6366F1"
                                      strokeWidth="1"
                                    />
                                  </svg>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                              <span>Boş iş akışı</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Workflow Info */}
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {workflow.description || 'Açıklama yok'}
                          </p>
                        </div>
                        
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>{workflow.modules.length} modül</span>
                          <span>{formatDate(workflow.updated_at)}</span>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex space-x-2 pt-2">
                          <Button
                            onClick={() => editWorkflow(workflow)}
                            size="sm"
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Düzenle
                          </Button>
                          <Button
                            onClick={() => {
                              setCurrentWorkflow(workflow);
                              runWorkflow();
                            }}
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Çalıştır
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      İş Akışı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Açıklama
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Modüller
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Son Güncelleme
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {workflows
                    .filter(workflow => workflow.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((workflow) => (
                      <tr key={workflow.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white">
                              <Zap className="h-4 w-4" />
                            </div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {workflow.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                            {workflow.description || 'Açıklama yok'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {workflow.modules.length} modül
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatDate(workflow.updated_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => editWorkflow(workflow)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Düzenle"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setCurrentWorkflow(workflow);
                                runWorkflow();
                              }}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title="Çalıştır"
                            >
                              <Play className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => duplicateWorkflow(workflow)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                              title="Çoğalt"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteWorkflow(workflow.id!)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Additional components
const ChevronLeft: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const Clock: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export default AutomationBuilderPage;
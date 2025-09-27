"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  Container,
  Grid,
  Paper,
  Card,
  CardContent,
  Avatar,
  useTheme,
  useMediaQuery,
  Chip,
  Button,
  Tabs,
  Tab,
  TextField,
  FormControlLabel,
  Radio,
  RadioGroup,
  LinearProgress,
  Backdrop,
  Fade,
  Modal,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Breadcrumbs,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fab,
  Menu,
  CircularProgress,
  Collapse,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  AccountCircle,
  Receipt,
  CreditCard,
  TrendingUp,
  People,
  Settings,
  Notifications,
  StickyNote2,
  ArrowBack,
  Quiz,
  Style,
  RssFeed,
  Edit,
  Save,
  Delete,
  CheckCircle,
  RadioButtonUnchecked,
  FlipToFront,
  Favorite,
  FavoriteBorder,
  ChatBubbleOutline,
  Repeat,
  Share,
  MoreVert,
  VerifiedUser,
  Reply,
  ExpandMore,
  ExpandLess,
  Folder,
  FolderOpen,
  CreateNewFolder,
  Upload,
  PictureAsPdf,
  AudioFile,
  VideoFile,
  YouTube,
  CloudUpload,
  PlayArrow,
  Stop,
  NavigateNext,
  Home,
  Add,
  MoreHoriz,
} from '@mui/icons-material';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { ProductListResponse } from "dodopayments/resources/index.mjs";
import { User } from "@supabase/supabase-js";
import {
  SelectPayment,
  SelectSubscription,
  SelectUser,
} from "@/lib/drizzle/schema";
import { SubscriptionManagement } from "./subscription-management";
import { InvoiceHistory } from "./invoice-history";
import { AccountManagement } from "./account-management";
import { toast } from "sonner";
import { changePlan } from "@/actions/change-plan";
import { cancelSubscription } from "@/actions/cancel-subscription";
import { FolderService, type Folder as FolderType, type CreateFolderRequest } from "@/lib/services/folders";
import { DocumentService, type Document, type DocumentSection, type CreateDocumentRequest, type ListDocumentsParams } from "@/lib/services/documents";
import { DocumentProcessor, type ProcessingStatus, type UploadCompleteData, type SectionCompleteData, getStageInfo, handleApiErrors, calculateProgress } from "@/lib/services/document-processor";
import {
  NotesService,
  QuizService,
  FlashcardsService,
  EduFeedService,
  type Note,
  type CreateNoteRequest,
  type CreateQuizRequest,
  type Quiz as QuizType,
  type Flashcard,
  type EduFeedPost,
  type QuizAnswers,
  type FlashcardReviewRequest,
  type CreateFlashcardRequest,
  type BulkCreateFlashcardsRequest,
  type UpdateFlashcardRequest
} from "@/lib/services/section-content";

const drawerWidth = 280;

// Simple markdown renderer for notes content
const renderMarkdownContent = (content: string) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let currentListType: 'ul' | 'ol' | null = null;
  let currentParagraph: string[] = [];

  const flushCurrentList = () => {
    if (currentList.length > 0) {
      elements.push(
        <Box component={currentListType === 'ol' ? 'ol' : 'ul'} key={`list-${elements.length}`} sx={{ pl: 3, mb: 2 }}>
          {currentList.map((item, idx) => {
            // Process inline formatting in list items
            let processedItem = item;
            processedItem = processedItem.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            processedItem = processedItem.replace(/__(.*?)__/g, '<strong>$1</strong>');
            processedItem = processedItem.replace(/\*(.*?)\*/g, '<em>$1</em>');
            processedItem = processedItem.replace(/_(.*?)_/g, '<em>$1</em>');
            processedItem = processedItem.replace(/`(.*?)`/g, '<code style="background-color: #f5f5f5; padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>');

            return (
              <Typography
                component="li"
                key={idx}
                variant="body1"
                sx={{ mb: 0.5, lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{ __html: processedItem }}
              />
            );
          })}
        </Box>
      );
      currentList = [];
      currentListType = null;
    }
  };

  const flushCurrentParagraph = () => {
    if (currentParagraph.length > 0) {
      const combinedText = currentParagraph.join('\n');

      // Process inline formatting (bold, italic, code)
      let processedText = combinedText;
      processedText = processedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      processedText = processedText.replace(/__(.*?)__/g, '<strong>$1</strong>');
      processedText = processedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
      processedText = processedText.replace(/_(.*?)_/g, '<em>$1</em>');
      processedText = processedText.replace(/`(.*?)`/g, '<code style="background-color: #f5f5f5; padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>');

      elements.push(
        <Typography
          key={`paragraph-${elements.length}`}
          variant="body1"
          sx={{
            mb: 2,
            lineHeight: 1.7,
            whiteSpace: 'pre-line' // Preserve line breaks within paragraphs
          }}
          dangerouslySetInnerHTML={{ __html: processedText }}
        />
      );
      currentParagraph = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Empty line - flush current paragraph/list and add spacing
    if (!trimmedLine) {
      flushCurrentParagraph();
      flushCurrentList();
      continue;
    }

    // Headers
    if (trimmedLine.startsWith('# ')) {
      flushCurrentParagraph();
      flushCurrentList();
      elements.push(
        <Typography key={i} variant="h4" sx={{ fontWeight: 'bold', mb: 2, mt: 2 }}>
          {trimmedLine.substring(2)}
        </Typography>
      );
    } else if (trimmedLine.startsWith('## ')) {
      flushCurrentParagraph();
      flushCurrentList();
      elements.push(
        <Typography key={i} variant="h5" sx={{ fontWeight: 'bold', mb: 1.5, mt: 1.5 }}>
          {trimmedLine.substring(3)}
        </Typography>
      );
    } else if (trimmedLine.startsWith('### ')) {
      flushCurrentParagraph();
      flushCurrentList();
      elements.push(
        <Typography key={i} variant="h6" sx={{ fontWeight: 'bold', mb: 1, mt: 1 }}>
          {trimmedLine.substring(4)}
        </Typography>
      );
    }
    // Unordered list
    else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      flushCurrentParagraph();
      if (currentListType !== 'ul') {
        flushCurrentList();
        currentListType = 'ul';
      }
      currentList.push(trimmedLine.substring(2));
    }
    // Ordered list
    else if (/^\d+\.\s/.test(trimmedLine)) {
      flushCurrentParagraph();
      if (currentListType !== 'ol') {
        flushCurrentList();
        currentListType = 'ol';
      }
      currentList.push(trimmedLine.replace(/^\d+\.\s/, ''));
    }
    // Code block
    else if (trimmedLine.startsWith('```')) {
      flushCurrentParagraph();
      flushCurrentList();
      const codeLines: string[] = [];
      i++; // Skip opening ```
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <Paper key={i} sx={{ p: 2, mb: 2, backgroundColor: 'grey.100', fontFamily: 'monospace' }}>
          <Typography component="pre" sx={{ fontSize: '0.875rem', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
            {codeLines.join('\n')}
          </Typography>
        </Paper>
      );
    }
    // Blockquote
    else if (trimmedLine.startsWith('> ')) {
      flushCurrentParagraph();
      flushCurrentList();
      elements.push(
        <Paper key={i} sx={{ p: 2, mb: 2, borderLeft: '4px solid #ccc', backgroundColor: 'grey.50' }}>
          <Typography variant="body1" sx={{ fontStyle: 'italic', lineHeight: 1.6 }}>
            {trimmedLine.substring(2)}
          </Typography>
        </Paper>
      );
    }
    // Regular text - add to current paragraph
    else {
      flushCurrentList();
      currentParagraph.push(line); // Keep original spacing
    }
  }

  // Flush any remaining paragraph or list
  flushCurrentParagraph();
  flushCurrentList();

  return elements;
};

interface MUIProps {
  products: ProductListResponse[];
  user: User;
  userSubscription: {
    subscription: SelectSubscription | null;
    user: SelectUser;
  };
  invoices: SelectPayment[];
}

const menuItems = [
  { text: 'Overview', icon: <DashboardIcon />, id: 'overview' },
  { text: 'Billing', icon: <CreditCard />, id: 'billing' },
  { text: 'Invoices', icon: <Receipt />, id: 'invoices' },
  { text: 'Notes', icon: <StickyNote2 />, id: 'notes' },
  { text: 'Account', icon: <AccountCircle />, id: 'account' },
  { text: 'Settings', icon: <Settings />, id: 'settings' },
];

export function MUIDashboard({ products, user, userSubscription, invoices }: MUIProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [selectedSection, setSelectedSection] = useState<DocumentSection | null>(null);
  const [documentSections, setDocumentSections] = useState<DocumentSection[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);

  // Section content state
  const [sectionNotes, setSectionNotes] = useState<Note[]>([]);
  const [sectionQuiz, setSectionQuiz] = useState<QuizType | null>(null);
  const [sectionFlashcards, setSectionFlashcards] = useState<Flashcard[]>([]);
  const [sectionPosts, setSectionPosts] = useState<EduFeedPost[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [noteDetailTab, setNoteDetailTab] = useState('notes');
  const [currentQuiz, setCurrentQuiz] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: string]: number | boolean | string}>({});
  const [showResults, setShowResults] = useState(false);
  const [quizResults, setQuizResults] = useState<any>(null);
  const [flippedCards, setFlippedCards] = useState<{[key: string]: boolean}>({});
  const [likedPosts, setLikedPosts] = useState<{[key: string]: boolean}>({});
  const [retweetedPosts, setRetweetedPosts] = useState<{[key: string]: boolean}>({});
  const [expandedComments, setExpandedComments] = useState<{[key: string]: boolean}>({});
  const [postComments, setPostComments] = useState<{[key: string]: string}>({});
  const [currentFolder, setCurrentFolder] = useState<FolderType | null>(null);
  const [folderPath, setFolderPath] = useState<FolderType[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadType, setUploadType] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [documentProcessor, setDocumentProcessor] = useState<DocumentProcessor | null>(null);
  const [processingStatuses, setProcessingStatuses] = useState<{[key: string]: ProcessingStatus}>({});
  const [fabMenuAnchor, setFabMenuAnchor] = useState<null | HTMLElement>(null);
  const [folderContextMenu, setFolderContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    folder: FolderType;
  } | null>(null);
  const [showRenameFolderDialog, setShowRenameFolderDialog] = useState(false);
  const [showDeleteFolderDialog, setShowDeleteFolderDialog] = useState(false);

  // Notes management state
  const [showCreateNoteDialog, setShowCreateNoteDialog] = useState(false);
  const [showEditNoteDialog, setShowEditNoteDialog] = useState(false);
  const [showDeleteNoteDialog, setShowDeleteNoteDialog] = useState(false);
  const [selectedNoteForEdit, setSelectedNoteForEdit] = useState<Note | null>(null);
  const [selectedNoteForDelete, setSelectedNoteForDelete] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // Quiz management state
  const [showCreateQuizDialog, setShowCreateQuizDialog] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [isEditingQuiz, setIsEditingQuiz] = useState(false);
  const [multipleChoiceQuestions, setMultipleChoiceQuestions] = useState([{
    question: '',
    options: ['', '', '', ''],
    correct_answer: 0,
    explanation: ''
  }]);
  const [trueFalseQuestions, setTrueFalseQuestions] = useState([{
    question: '',
    answer: true,
    explanation: ''
  }]);
  const [fillInBlankQuestions, setFillInBlankQuestions] = useState([{
    question: '',
    answer: ''
  }]);
  const [shortAnswerQuestions, setShortAnswerQuestions] = useState([{
    question: '',
    sample_answer: ''
  }]);

  // Flashcard management state
  const [showCreateFlashcardDialog, setShowCreateFlashcardDialog] = useState(false);
  const [showEditFlashcardDialog, setShowEditFlashcardDialog] = useState(false);
  const [showDeleteFlashcardDialog, setShowDeleteFlashcardDialog] = useState(false);
  const [showBulkCreateDialog, setShowBulkCreateDialog] = useState(false);
  const [selectedFlashcardForEdit, setSelectedFlashcardForEdit] = useState<Flashcard | null>(null);
  const [selectedFlashcardForDelete, setSelectedFlashcardForDelete] = useState<Flashcard | null>(null);
  const [flashcardFrontText, setFlashcardFrontText] = useState('');
  const [flashcardBackText, setFlashcardBackText] = useState('');
  const [flashcardDifficulty, setFlashcardDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isCreatingFlashcard, setIsCreatingFlashcard] = useState(false);
  const [bulkFlashcards, setBulkFlashcards] = useState<CreateFlashcardRequest[]>([{
    front_text: '',
    back_text: '',
    difficulty_level: 'medium'
  }]);

  const [renameFolderName, setRenameFolderName] = useState('');
  const [selectedFolderForAction, setSelectedFolderForAction] = useState<FolderType | null>(null);
  const [isClient, setIsClient] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));


  // Mark as client-side after mount to avoid hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load folders and documents on component mount and when current folder changes
  useEffect(() => {
    loadFoldersAndDocuments();
  }, [currentFolder]);

  // Initialize DocumentProcessor for real-time updates
  useEffect(() => {
    const initializeDocumentProcessor = async () => {
      try {
        // Get auth token for Socket.IO
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.access_token && session?.user?.id) {
          const processor = new DocumentProcessor(
            session.user.id,
            session.access_token
          );

          // Set up event listeners
          processor.on('upload-complete', (data: UploadCompleteData) => {
            toast.success(`Document "${data.document.title}" uploaded successfully`);
            loadFoldersAndDocuments(); // Refresh document list
          });

          processor.on('processing-update', (data: ProcessingStatus) => {
            setProcessingStatuses(prev => ({
              ...prev,
              [data.documentId]: data
            }));

            const stageInfo = getStageInfo(data.stage);
            if (data.status === 'failed') {
              toast.error(`Processing failed: ${data.message}`);
            } else if (data.status === 'completed') {
              toast.success('Document processing completed!');
              loadFoldersAndDocuments(); // Refresh to show updated status
            }
          });

          processor.on('section-complete', (data: SectionCompleteData) => {
            toast.success(`Section "${data.sectionTitle}" processed with ${data.itemsCount} ${data.contentType} items`);
          });

          processor.on('error', (error: any) => {
            const errorMessage = handleApiErrors(error);
            toast.error(`Connection error: ${errorMessage}`);
          });

          processor.on('disconnect', (data: any) => {
            toast.warning('Real-time connection lost. Attempting to reconnect...');
          });

          // Connect to Socket.IO
          await processor.connect();
          setDocumentProcessor(processor);

          console.log('DocumentProcessor initialized and connected');

          // Expose test function globally for debugging
          (window as any).testSocketConnection = () => processor.testConnection();
          console.log('💡 Debug: Run `testSocketConnection()` in console to test backend connection');
        }
      } catch (error) {
        console.error('Failed to initialize DocumentProcessor:', error);
      }
    };

    initializeDocumentProcessor();

    // Cleanup on unmount
    return () => {
      if (documentProcessor) {
        documentProcessor.disconnect();
      }
    };
  }, []);

  const loadFoldersAndDocuments = async () => {
    try {
      setLoading(true);

      // Load folders and documents in parallel
      const [foldersResponse, documentsResponse] = await Promise.all([
        FolderService.listFolders({
          parent_folder_id: currentFolder?.id || null,
          limit: 50,
          offset: 0
        }),
        DocumentService.listDocuments({
          folder_id: currentFolder?.id || undefined,
          limit: 50,
          offset: 0
        })
      ]);

      setFolders(foldersResponse.folders);
      setDocuments(documentsResponse.documents);
    } catch (error) {
      console.error('Error loading folders and documents:', error);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  // For backwards compatibility
  const loadFolders = loadFoldersAndDocuments;

  // Get current folder documents
  const getCurrentFolderDocuments = () => {
    return documents;
  };

  // Quiz and flashcard helper functions
  const handleQuizAnswer = (questionKey: string, answer: number | string) => {
    setSelectedAnswers(prev => ({...prev, [questionKey]: answer}));
  };

  const submitQuiz = async () => {
    if (!sectionQuiz) return;

    try {
      setLoading(true);

      // Prepare answers in the format expected by the API
      const quizAnswers: QuizAnswers = {};

      // Process different question types
      Object.keys(selectedAnswers).forEach(questionKey => {
        quizAnswers[questionKey] = selectedAnswers[questionKey];
      });

      const response = await QuizService.submitQuizAttempt(sectionQuiz.id, quizAnswers);

      toast.success(`Quiz completed! Score: ${response.percentage}%`);
      setShowResults(true);
      setQuizResults(response);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
    } finally {
      setLoading(false);
    }
  };

  const flipCard = (cardId: number) => {
    setFlippedCards(prev => ({...prev, [cardId]: !prev[cardId]}));
  };

  const handleFlashcardReview = async (flashcardId: string, quality: number) => {
    try {
      setLoading(true);
      const response = await FlashcardsService.reviewFlashcard(flashcardId, { quality });

      // Update the flashcard in local state with new review data
      setSectionFlashcards(prev =>
        prev.map(card =>
          card.id === flashcardId
            ? {
                ...card,
                easiness_factor: response.review_data.easiness_factor,
                interval_days: response.review_data.interval_days,
                repetitions: response.review_data.repetitions,
                next_review_date: response.review_data.next_review_date,
                last_reviewed_at: new Date().toISOString()
              }
            : card
        )
      );

      toast.success(response.message || 'Flashcard reviewed successfully');
    } catch (error) {
      console.error('Error reviewing flashcard:', error);
      toast.error('Failed to review flashcard');
    } finally {
      setLoading(false);
    }
  };

  const resetFlashcardForm = () => {
    setFlashcardFrontText('');
    setFlashcardBackText('');
    setFlashcardDifficulty('medium');
    setSelectedFlashcardForEdit(null);
  };

  const resetBulkFlashcardForm = () => {
    setBulkFlashcards([{
      front_text: '',
      back_text: '',
      difficulty_level: 'medium'
    }]);
  };

  const handleEditFlashcard = (flashcard: any) => {
    setSelectedFlashcardForEdit(flashcard);
    setFlashcardFrontText(flashcard.front_text);
    setFlashcardBackText(flashcard.back_text);
    setFlashcardDifficulty(flashcard.difficulty_level);
    setShowEditFlashcardDialog(true);
  };

  const handleDeleteFlashcard = async (flashcardId: string) => {
    if (!window.confirm('Are you sure you want to delete this flashcard?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await FlashcardsService.deleteFlashcard(flashcardId);

      // Remove flashcard from local state
      setSectionFlashcards(prev => prev.filter(card => card.id !== flashcardId));

      toast.success(response.message || 'Flashcard deleted successfully');
    } catch (error) {
      console.error('Error deleting flashcard:', error);
      toast.error('Failed to delete flashcard');
    } finally {
      setLoading(false);
    }
  };

  // Feed interaction functions

  // EduFeed post interaction handler
  const handlePostInteraction = async (postId: string, interactionType: 'like' | 'comment' | 'share', content?: string) => {
    try {
      const response = await EduFeedService.interactWithPost(postId, {
        interaction_type: interactionType,
        content
      });

      // Update the post in the local state
      setSectionPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? {
                ...post,
                likes_count: response.updated_counts.likes_count,
                replies_count: response.updated_counts.replies_count,
                user_interaction: response.interaction_type === 'like' ?
                  (post.user_interaction === 'like' ? null : 'like') : post.user_interaction
              }
            : post
        )
      );

      // Clear comment text after successful comment submission
      if (interactionType === 'comment') {
        setPostComments(prev => ({...prev, [postId]: ''}));
      }

      toast.success(response.message);
    } catch (error) {
      console.error('Error interacting with post:', error);
      toast.error('Failed to interact with post');
    }
  };

  const handleRetweetPost = async (postId: string) => {
    try {
      await handlePostInteraction(postId, 'share');
      setRetweetedPosts(prev => ({...prev, [postId]: !prev[postId]}));
    } catch (error) {
      console.error('Error retweeting post:', error);
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => ({...prev, [postId]: !prev[postId]}));
  };

  const handleCommentChange = (postId: string, comment: string) => {
    setPostComments(prev => ({...prev, [postId]: comment}));
  };

  // Folder and upload helper functions
  const getCurrentFolderNotes = () => {
    return getCurrentFolderDocuments();
  };

  const getCurrentSubfolders = () => {
    return folders;
  };

  const getFolderPath = async (folderId: string): Promise<FolderType[]> => {
    const path: FolderType[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      try {
        const response = await FolderService.getFolderDetails(currentId);
        path.unshift(response.folder);
        currentId = response.folder.parent_folder_id;
      } catch (error) {
        console.error('Error getting folder path:', error);
        break;
      }
    }

    return path;
  };

  const navigateToFolder = async (folder: FolderType) => {
    setCurrentFolder(folder);
    const path = await getFolderPath(folder.id);
    setFolderPath(path);
  };

  const navigateToRoot = () => {
    setCurrentFolder(null);
    setFolderPath([]);
  };

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      try {
        setLoading(true);
        await FolderService.createFolder({
          name: newFolderName,
          parent_folder_id: currentFolder?.id || null
        });
        toast.success('Folder created successfully');
        setNewFolderName('');
        setShowCreateFolderDialog(false);
        await loadFolders(); // Reload folders
      } catch (error) {
        console.error('Error creating folder:', error);
        toast.error('Failed to create folder');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFolderContextMenu = (event: React.MouseEvent, folder: FolderType) => {
    event.preventDefault();
    event.stopPropagation();
    setFolderContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
      folder,
    });
  };

  const handleCloseFolderContextMenu = () => {
    setFolderContextMenu(null);
  };

  const handleRenameFolder = async () => {
    if (selectedFolderForAction && renameFolderName.trim()) {
      try {
        setLoading(true);
        await FolderService.updateFolder(selectedFolderForAction.id, {
          name: renameFolderName
        });
        toast.success('Folder renamed successfully');
        setRenameFolderName('');
        setShowRenameFolderDialog(false);
        setSelectedFolderForAction(null);
        await loadFolders(); // Reload folders
      } catch (error) {
        console.error('Error renaming folder:', error);
        toast.error('Failed to rename folder');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteFolder = async (force: boolean = false) => {
    if (selectedFolderForAction) {
      try {
        setLoading(true);
        await FolderService.deleteFolder(selectedFolderForAction.id, force);
        toast.success('Folder deleted successfully');
        setShowDeleteFolderDialog(false);
        setSelectedFolderForAction(null);
        await loadFolders(); // Reload folders
      } catch (error) {
        console.error('Error deleting folder:', error);
        toast.error('Failed to delete folder');
      } finally {
        setLoading(false);
      }
    }
  };

  // Notes management functions
  const handleCreateNote = useCallback(() => {
    if (!isClient) {
      return;
    }

    setNoteTitle('');
    setNoteContent('');
    setShowCreateNoteDialog(true);
  }, [isClient]);

  const handleEditNote = (note: Note) => {
    setSelectedNoteForEdit(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setShowEditNoteDialog(true);
  };

  const handleDeleteNote = (note: Note) => {
    setSelectedNoteForDelete(note);
    setShowDeleteNoteDialog(true);
  };

  const submitCreateNote = async () => {
    if (!selectedSection || !noteTitle.trim() || !noteContent.trim()) {
      toast.error('Please fill in both title and content');
      return;
    }

    try {
      setLoading(true);

      // Create the note using the API
      const response = await NotesService.createSectionNote(selectedSection.id, {
        title: noteTitle.trim(),
        content: noteContent.trim()
      });

      // Success feedback
      toast.success(`Note "${response.note.title}" created successfully`);

      // Reset form and close dialog
      setShowCreateNoteDialog(false);
      setNoteTitle('');
      setNoteContent('');

      // Refresh the section content to show the new note
      await loadAllSectionContent(selectedSection.id);
    } catch (error) {
      console.error('Error creating note:', error);
      const errorMessage = handleApiErrors ? handleApiErrors(error) : 'Failed to create note';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const submitEditNote = async () => {
    if (!selectedNoteForEdit || !noteTitle.trim() || !noteContent.trim()) {
      toast.error('Please fill in both title and content');
      return;
    }

    try {
      setLoading(true);
      await NotesService.updateNote(selectedNoteForEdit.id, {
        title: noteTitle,
        content: noteContent
      });

      // Update the note in the local state
      setSectionNotes(prev =>
        prev.map(note =>
          note.id === selectedNoteForEdit.id
            ? { ...note, title: noteTitle, content: noteContent }
            : note
        )
      );

      toast.success('Note updated successfully');
      setShowEditNoteDialog(false);
      setSelectedNoteForEdit(null);
      setNoteTitle('');
      setNoteContent('');
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update note');
    } finally {
      setLoading(false);
    }
  };

  const submitDeleteNote = async () => {
    if (!selectedNoteForDelete) return;

    try {
      setLoading(true);
      await NotesService.deleteNote(selectedNoteForDelete.id);

      // Remove the note from local state
      setSectionNotes(prev =>
        prev.filter(note => note.id !== selectedNoteForDelete.id)
      );

      toast.success('Note deleted successfully');
      setShowDeleteNoteDialog(false);
      setSelectedNoteForDelete(null);
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    } finally {
      setLoading(false);
    }
  };

  // Quiz management functions
  const handleCreateQuiz = useCallback(() => {
    if (!isClient) {
      return;
    }

    // Check if we're editing an existing quiz or creating a new one
    const isEditing = !!sectionQuiz;
    setIsEditingQuiz(isEditing);

    if (isEditing && sectionQuiz) {
      // Pre-populate with existing quiz data
      setQuizTitle(sectionQuiz.title);

      // Extract existing questions by type
      const existingMC = sectionQuiz.questions.multiple_choice || [];
      const existingTF = sectionQuiz.questions.true_false || [];
      const existingFIB = sectionQuiz.questions.fill_in_blank || [];
      const existingSA = sectionQuiz.questions.short_answer || [];

      // Add existing questions plus one empty question for each type
      setMultipleChoiceQuestions([
        ...existingMC.map(q => ({
          question: q.question,
          options: q.options || ['', '', '', ''],
          correct_answer: q.correct_answer || 0,
          explanation: q.explanation || ''
        })),
        {
          question: '',
          options: ['', '', '', ''],
          correct_answer: 0,
          explanation: ''
        }
      ]);

      setTrueFalseQuestions([
        ...existingTF.map(q => ({
          question: q.question,
          answer: typeof q.answer === 'boolean' ? q.answer : true,
          explanation: q.explanation || ''
        })),
        {
          question: '',
          answer: true,
          explanation: ''
        }
      ]);

      setFillInBlankQuestions([
        ...existingFIB.map(q => ({
          question: q.question,
          answer: typeof q.answer === 'string' ? q.answer : ''
        })),
        {
          question: '',
          answer: ''
        }
      ]);

      setShortAnswerQuestions([
        ...existingSA.map(q => ({
          question: q.question,
          sample_answer: q.sample_answer || ''
        })),
        {
          question: '',
          sample_answer: ''
        }
      ]);
    } else {
      // Initialize with empty questions for new quiz
      setQuizTitle('');
      setMultipleChoiceQuestions([{
        question: '',
        options: ['', '', '', ''],
        correct_answer: 0,
        explanation: ''
      }]);
      setTrueFalseQuestions([{
        question: '',
        answer: true,
        explanation: ''
      }]);
      setFillInBlankQuestions([{
        question: '',
        answer: ''
      }]);
      setShortAnswerQuestions([{
        question: '',
        sample_answer: ''
      }]);
    }

    setShowCreateQuizDialog(true);
  }, [isClient, sectionQuiz]);

  const submitCreateQuiz = async () => {
    if (!selectedSection || !quizTitle.trim()) {
      toast.error('Please provide a quiz title');
      return;
    }

    // Validate at least one question exists
    const hasValidMC = multipleChoiceQuestions.some(q => q.question.trim() && q.options.every(opt => opt.trim()));
    const hasValidTF = trueFalseQuestions.some(q => q.question.trim());
    const hasValidFIB = fillInBlankQuestions.some(q => q.question.trim() && q.answer.trim());
    const hasValidSA = shortAnswerQuestions.some(q => q.question.trim() && q.sample_answer.trim());

    if (!hasValidMC && !hasValidTF && !hasValidFIB && !hasValidSA) {
      toast.error('Please add at least one complete question');
      return;
    }

    try {
      setIsCreatingQuiz(true);

      // Filter out empty questions
      const validMCQuestions = multipleChoiceQuestions.filter(q =>
        q.question.trim() && q.options.every(opt => opt.trim())
      );
      const validTFQuestions = trueFalseQuestions.filter(q => q.question.trim());
      const validFIBQuestions = fillInBlankQuestions.filter(q =>
        q.question.trim() && q.answer.trim()
      );
      const validSAQuestions = shortAnswerQuestions.filter(q =>
        q.question.trim() && q.sample_answer.trim()
      );

      const quizData: CreateQuizRequest = {
        title: quizTitle.trim(),
        questions: {
          multiple_choice: validMCQuestions,
          true_false: validTFQuestions,
          fill_in_blank: validFIBQuestions,
          short_answer: validSAQuestions
        }
      };

      let response;
      if (isEditingQuiz && sectionQuiz) {
        // Update existing quiz
        response = await QuizService.updateQuiz(sectionQuiz.id, quizData);
        toast.success(`Quiz "${response.quiz.title}" updated successfully`);
      } else {
        // Create new quiz
        response = await QuizService.createSectionQuiz(selectedSection.id, quizData);
        toast.success(`Quiz "${response.quiz.title}" created successfully`);
      }

      setShowCreateQuizDialog(false);

      // Reload section content to show the updated/new quiz
      await loadAllSectionContent(selectedSection.id);

    } catch (error) {
      console.error('Error saving quiz:', error);
      toast.error(isEditingQuiz ? 'Failed to update quiz' : 'Failed to create quiz');
    } finally {
      setIsCreatingQuiz(false);
    }
  };

  // Flashcard management functions
  const handleCreateFlashcard = useCallback(() => {
    if (!isClient) {
      return;
    }

    setFlashcardFrontText('');
    setFlashcardBackText('');
    setFlashcardDifficulty('medium');
    setShowCreateFlashcardDialog(true);
  }, [isClient]);

  // const handleEditFlashcard = (flashcard: Flashcard) => {
  //   setSelectedFlashcardForEdit(flashcard);
  //   setFlashcardFrontText(flashcard.front_text);
  //   setFlashcardBackText(flashcard.back_text);
  //   setFlashcardDifficulty(flashcard.difficulty_level as 'easy' | 'medium' | 'hard');
  //   setShowEditFlashcardDialog(true);
  // };

  // const handleDeleteFlashcard = (flashcard: Flashcard) => {
  //   setSelectedFlashcardForDelete(flashcard);
  //   setShowDeleteFlashcardDialog(true);
  // };

  const handleBulkCreate = useCallback(() => {
    if (!isClient) {
      return;
    }

    setBulkFlashcards([{
      front_text: '',
      back_text: '',
      difficulty_level: 'medium'
    }]);
    setShowBulkCreateDialog(true);
  }, [isClient]);

  const submitCreateFlashcard = async () => {
    if (!selectedSection || !flashcardFrontText.trim() || !flashcardBackText.trim()) {
      toast.error('Please fill in both front and back text');
      return;
    }

    // Validate text length
    if (flashcardFrontText.length > 500) {
      toast.error('Front text must be 500 characters or less');
      return;
    }

    if (flashcardBackText.length > 1000) {
      toast.error('Back text must be 1000 characters or less');
      return;
    }

    try {
      setIsCreatingFlashcard(true);

      const flashcardData: CreateFlashcardRequest = {
        front_text: flashcardFrontText.trim(),
        back_text: flashcardBackText.trim(),
        difficulty_level: flashcardDifficulty
      };

      const response = await FlashcardsService.createSectionFlashcard(selectedSection.id, flashcardData);

      toast.success('Flashcard created successfully');
      setShowCreateFlashcardDialog(false);
      resetFlashcardForm();

      // Reload section content to show the new flashcard
      await loadAllSectionContent(selectedSection.id);

    } catch (error) {
      console.error('Error creating flashcard:', error);
      toast.error('Failed to create flashcard');
    } finally {
      setIsCreatingFlashcard(false);
    }
  };

  const submitEditFlashcard = async () => {
    if (!selectedFlashcardForEdit || !flashcardFrontText.trim() || !flashcardBackText.trim()) {
      toast.error('Please fill in both front and back text');
      return;
    }

    // Validate text length
    if (flashcardFrontText.length > 500) {
      toast.error('Front text must be 500 characters or less');
      return;
    }

    if (flashcardBackText.length > 1000) {
      toast.error('Back text must be 1000 characters or less');
      return;
    }

    try {
      setIsCreatingFlashcard(true);

      const updateData: UpdateFlashcardRequest = {
        front_text: flashcardFrontText.trim(),
        back_text: flashcardBackText.trim(),
        difficulty_level: flashcardDifficulty
      };

      await FlashcardsService.updateFlashcard(selectedFlashcardForEdit.id, updateData);

      toast.success('Flashcard updated successfully');
      setShowEditFlashcardDialog(false);
      resetFlashcardForm();

      // Reload section content to show the updated flashcard
      if (selectedSection) {
        await loadAllSectionContent(selectedSection.id);
      }

    } catch (error) {
      console.error('Error updating flashcard:', error);
      toast.error('Failed to update flashcard');
    } finally {
      setIsCreatingFlashcard(false);
    }
  };

  const submitDeleteFlashcard = async () => {
    if (!selectedFlashcardForDelete) return;

    try {
      setLoading(true);
      await FlashcardsService.deleteFlashcard(selectedFlashcardForDelete.id);

      toast.success('Flashcard deleted successfully');
      setShowDeleteFlashcardDialog(false);
      setSelectedFlashcardForDelete(null);

      // Reload section content to show updated list
      if (selectedSection) {
        await loadAllSectionContent(selectedSection.id);
      }

    } catch (error) {
      console.error('Error deleting flashcard:', error);
      toast.error('Failed to delete flashcard');
    } finally {
      setLoading(false);
    }
  };

  const submitBulkCreateFlashcards = async () => {
    if (!selectedSection) {
      toast.error('No section selected');
      return;
    }

    // Filter out empty flashcards
    const validFlashcards = bulkFlashcards.filter(card =>
      card.front_text.trim() && card.back_text.trim()
    );

    if (validFlashcards.length === 0) {
      toast.error('Please add at least one complete flashcard');
      return;
    }

    if (validFlashcards.length > 50) {
      toast.error('Maximum 50 flashcards can be created at once');
      return;
    }

    // Validate text lengths
    for (const card of validFlashcards) {
      if (card.front_text.length > 500) {
        toast.error('Front text must be 500 characters or less for all flashcards');
        return;
      }
      if (card.back_text.length > 1000) {
        toast.error('Back text must be 1000 characters or less for all flashcards');
        return;
      }
    }

    try {
      setIsCreatingFlashcard(true);

      const bulkData: BulkCreateFlashcardsRequest = {
        flashcards: validFlashcards
      };

      const response = await FlashcardsService.createBulkSectionFlashcards(selectedSection.id, bulkData);

      toast.success(`${response.created_count} flashcards created successfully`);
      setShowBulkCreateDialog(false);
      resetBulkFlashcardForm();

      // Reload section content to show the new flashcards
      await loadAllSectionContent(selectedSection.id);

    } catch (error) {
      console.error('Error creating flashcards:', error);
      toast.error('Failed to create flashcards');
    } finally {
      setIsCreatingFlashcard(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadFile(file);
      // Determine upload type based on file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'pdf') {
        setUploadType('pdf');
      } else if (['mp3', 'wav', 'm4a', 'ogg'].includes(extension || '')) {
        setUploadType('audio');
      } else {
        setUploadType('file');
      }
    }
  };

  const handleUpload = async () => {
    if (!uploadFile && !youtubeUrl.trim()) {
      toast.error('Please select a file or enter a YouTube URL');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      if (uploadType === 'pdf' && uploadFile) {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90; // Keep at 90% until actual upload completes
            }
            return prev + 10;
          });
        }, 200);

        // Upload PDF document
        const response = await DocumentService.uploadDocument({
          file: uploadFile,
          folder_id: currentFolder?.id
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        // The DocumentProcessor will handle real-time updates via Socket.IO
        // But we still show initial success message
        toast.success(`Document "${response.document.title}" uploaded. Processing started...`);

        // Reset form
        setShowUploadDialog(false);
        setUploadFile(null);
        setYoutubeUrl('');
        setUploadType('');

        // Reload to show new document immediately
        await loadFoldersAndDocuments();
      } else if (uploadType === 'youtube' && youtubeUrl.trim()) {
        // For now, YouTube uploads are not implemented in the backend
        toast.info('YouTube upload feature coming soon');
        return;
      } else if (uploadType === 'audio' && uploadFile) {
        // For now, audio uploads are not implemented in the backend
        toast.info('Audio upload feature coming soon');
        return;
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      const errorMessage = handleApiErrors(error);
      toast.error(`Upload failed: ${errorMessage}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'pdf':
        return <PictureAsPdf sx={{ color: '#d32f2f' }} />;
      case 'audio':
        return <AudioFile sx={{ color: '#1976d2' }} />;
      case 'youtube':
        return <YouTube sx={{ color: '#ff0000' }} />;
      default:
        return <VideoFile sx={{ color: '#388e3c' }} />;
    }
  };

  const getProcessingStatusChip = (status: string, documentId?: string) => {
    // Check if we have real-time status for this document
    const realtimeStatus = documentId ? processingStatuses[documentId] : null;
    const currentStatus = realtimeStatus?.status || status;
    const currentStage = realtimeStatus?.stage;

    // Get stage info for display
    const stageInfo = currentStage ? getStageInfo(currentStage) : null;
    const progress = realtimeStatus ? calculateProgress(realtimeStatus) : undefined;

    switch (currentStatus) {
      case 'completed':
        return (
          <Chip
            label="Ready"
            size="small"
            color="success"
            icon={<CheckCircle sx={{ fontSize: 16 }} />}
          />
        );
      case 'processing':
        return (
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              label={stageInfo ? stageInfo.message : "Processing"}
              size="small"
              color="warning"
              icon={<CircularProgress size={12} />}
            />
            {progress !== undefined && (
              <Typography variant="caption" color="text.secondary">
                {progress}%
              </Typography>
            )}
          </Box>
        );
      case 'failed':
        return (
          <Chip
            label="Failed"
            size="small"
            color="error"
            icon={<Delete sx={{ fontSize: 16 }} />}
          />
        );
      case 'pending':
        return (
          <Chip
            label="Queued"
            size="small"
            color="info"
            icon={<CircularProgress size={12} />}
          />
        );
      default:
        return <Chip label="Unknown" size="small" color="default" />;
    }
  };

  // Retry document processing
  const handleRetryProcessing = async (documentId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation(); // Prevent card click
    }

    try {
      await DocumentService.retryDocumentProcessing(documentId);
      toast.success('Processing retry initiated. You will receive real-time updates.');

      // Refresh document list to show updated status
      await loadFoldersAndDocuments();
    } catch (error) {
      console.error('Error retrying document processing:', error);
      const errorMessage = handleApiErrors(error);
      toast.error(`Failed to retry processing: ${errorMessage}`);
    }
  };

  // Load document sections when a document is selected
  const loadDocumentSections = async (documentId: string) => {
    try {
      setSectionsLoading(true);
      const response = await DocumentService.getDocumentSections(documentId);
      setDocumentSections(response.sections);

      // Select first section by default if available
      if (response.sections.length > 0) {
        setSelectedSection(response.sections[0]);
      }
    } catch (error) {
      console.error('Error loading document sections:', error);
      toast.error('Failed to load document sections');
      setDocumentSections([]);
    } finally {
      setSectionsLoading(false);
    }
  };

  // Load section content when user clicks on a section
  const loadSectionContent = async (documentId: string, sectionId: string) => {
    try {
      const response = await DocumentService.getDocumentSection(documentId, sectionId);

      // Update the selected section with full content
      setSelectedSection(response.section);

      // Also update the section in the sections list
      setDocumentSections(prev =>
        prev.map(section =>
          section.id === sectionId
            ? { ...section, content: response.section.content }
            : section
        )
      );
    } catch (error) {
      console.error('Error loading section content:', error);
      toast.error('Failed to load section content');
    }
  };

  // Load all content for a section (quiz, flashcards, edufeed)
  const loadAllSectionContent = async (sectionId: string) => {
    try {
      setContentLoading(true);

      // Load all section content in parallel
      const [notesResponse, quizResponse, flashcardsResponse, eduFeedResponse] = await Promise.allSettled([
        NotesService.getSectionNotes(sectionId, { limit: 50 }),
        QuizService.getSectionQuiz(sectionId),
        FlashcardsService.getSectionFlashcards(sectionId, { limit: 50 }),
        EduFeedService.getSectionPosts(sectionId, { limit: 20 })
      ]);

      // Handle notes response
      if (notesResponse.status === 'fulfilled') {
        setSectionNotes(notesResponse.value.notes);
      } else {
        console.error('Failed to load notes:', notesResponse.reason);
        setSectionNotes([]);
      }

      // Handle quiz response
      if (quizResponse.status === 'fulfilled') {
        setSectionQuiz(quizResponse.value.quiz);
      } else {
        console.error('Failed to load quiz:', quizResponse.reason);
        setSectionQuiz(null);
      }

      // Handle flashcards response
      if (flashcardsResponse.status === 'fulfilled') {
        setSectionFlashcards(flashcardsResponse.value.flashcards);
      } else {
        console.error('Failed to load flashcards:', flashcardsResponse.reason);
        setSectionFlashcards([]);
      }

      // Handle edufeed response
      if (eduFeedResponse.status === 'fulfilled') {
        setSectionPosts(eduFeedResponse.value.posts);
      } else {
        console.error('Failed to load edufeed:', eduFeedResponse.reason);
        setSectionPosts([]);
      }
    } catch (error) {
      console.error('Error loading section content:', error);
      toast.error('Failed to load section content');
    } finally {
      setContentLoading(false);
    }
  };

  // Reset quiz and flashcard states when a new note is selected
  useEffect(() => {
    if (selectedNote) {
      setNoteDetailTab('notes');
      setSelectedAnswers({});
      setShowResults(false);
      setFlippedCards({});
      setLikedPosts({});
      setRetweetedPosts({});
      setExpandedComments({});
      setPostComments({});
      setSelectedSection(null);
      setDocumentSections([]);

      // Load sections if this is a document
      if (selectedNote.id && selectedNote.processing_status) {
        loadDocumentSections(selectedNote.id);
      }
    }
  }, [selectedNote]);

  const handlePlanChange = async (productId: string) => {
    if (userSubscription.user.currentSubscriptionId) {
      const res = await changePlan({
        subscriptionId: userSubscription.user.currentSubscriptionId,
        productId,
      });

      if (!res.success) {
        toast.error(res.error);
        return;
      }

      toast.success("Plan changed successfully");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      window.location.reload();
      return;
    }

    try {
      const response = await fetch(`${window.location.origin}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_cart: [{
            product_id: productId,
            quantity: 1,
          }],
          customer: {
            email: user.email,
            name: user.user_metadata.name,
          },
          return_url: `${window.location.origin}/dashboard`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { checkout_url } = await response.json();
      window.location.href = checkout_url;
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout process");
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Calculate statistics
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(inv => inv.status === 'succeeded').length;
  const totalRevenue = invoices
    .filter(inv => inv.status === 'succeeded')
    .reduce((sum, inv) => sum + Number(inv.totalAmount), 0) / 100;

  const currentPlan = products.find(
    (product) => product.product_id === userSubscription.subscription?.productId
  );

  // Chart data
  const monthlyData = [
    { month: 'Jan', revenue: 1200 },
    { month: 'Feb', revenue: 1900 },
    { month: 'Mar', revenue: 3000 },
    { month: 'Apr', revenue: 5000 },
    { month: 'May', revenue: 2000 },
    { month: 'Jun', revenue: 3000 },
  ];

  const pieData = [
    { id: 0, value: 60, label: 'Subscriptions' },
    { id: 1, value: 30, label: 'One-time' },
    { id: 2, value: 10, label: 'Refunds' },
  ];

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
          Dashboard
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={activeTab === item.id}
              onClick={() => handleTabChange(item.id)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main + '20',
                  borderRight: `3px solid ${theme.palette.primary.main}`,
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.main,
                  },
                  '& .MuiListItemText-primary': {
                    color: theme.palette.primary.main,
                    fontWeight: 'medium',
                  },
                },
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  const renderOverview = () => (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Welcome back, {user.user_metadata.name}!
      </Typography>

      {/* Statistics Cards */}
      <Box
        display="grid"
        gridTemplateColumns={{
          xs: 'repeat(1, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(4, 1fr)'
        }}
        gap={3}
        sx={{ mb: 4 }}
      >
        <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  ${totalRevenue.toFixed(2)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Total Revenue
                </Typography>
              </Box>
              <TrendingUp sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {totalInvoices}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Total Invoices
                </Typography>
              </Box>
              <Receipt sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {paidInvoices}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Paid Invoices
                </Typography>
              </Box>
              <CreditCard sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {userSubscription.subscription ? 'Active' : 'None'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Subscription
                </Typography>
              </Box>
              <People sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Charts Section */}
      <Box
        display="grid"
        gridTemplateColumns={{
          xs: 'repeat(1, 1fr)',
          md: '2fr 1fr'
        }}
        gap={3}
        sx={{ mb: 4 }}
      >
        <Paper sx={{ p: 3, height: 400 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            Revenue Trend
          </Typography>
          <BarChart
            xAxis={[{ scaleType: 'band', data: monthlyData.map(d => d.month) }]}
            series={[{ data: monthlyData.map(d => d.revenue) }]}
            width={undefined}
            height={300}
          />
        </Paper>

        <Paper sx={{ p: 3, height: 400 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            Revenue Distribution
          </Typography>
          <PieChart
            series={[
              {
                data: pieData,
              },
            ]}
            width={undefined}
            height={300}
          />
        </Paper>
      </Box>

      {/* Current Plan Card */}
      {userSubscription.subscription && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            Current Subscription
          </Typography>
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
              <CreditCard />
            </Avatar>
            <Box flex={1} minWidth={200}>
              <Typography variant="h6">
                {currentPlan?.name || 'Unknown Plan'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentPlan?.description || 'No description available'}
              </Typography>
            </Box>
            <Chip
              label={userSubscription.subscription.status}
              color={userSubscription.subscription.status === 'active' ? 'success' : 'error'}
              variant="outlined"
            />
            <Typography variant="h6">
              ${Number(currentPlan?.price || 0) / 100}/{userSubscription.subscription.paymentPeriodInterval?.toLowerCase()}
            </Typography>
          </Box>
        </Paper>
      )}
    </Container>
  );

  const renderNotes = () => (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4, position: 'relative' }}>
      {/* Header with Breadcrumbs */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            {currentFolder ? currentFolder.name : 'My Library'}
          </Typography>

          {/* Breadcrumbs */}
          <Breadcrumbs separator={<NavigateNext fontSize="small" />}>
            <Link
              component="button"
              variant="body2"
              onClick={navigateToRoot}
              sx={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              <Home sx={{ mr: 0.5, fontSize: 16 }} />
              Library
            </Link>
            {folderPath.map((folder, index) => (
              <Link
                key={folder.id}
                component="button"
                variant="body2"
                onClick={() => navigateToFolder(folder)}
                sx={{
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                {folder.name}
              </Link>
            ))}
          </Breadcrumbs>
        </Box>

        <Button
          variant="outlined"
          startIcon={<CreateNewFolder />}
          onClick={() => setShowCreateFolderDialog(true)}
          sx={{ borderRadius: 2 }}
        >
          New Folder
        </Button>
      </Box>

      {/* Folders Section */}
      {getCurrentSubfolders().length > 0 && (
        <Box mb={4}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Folders
          </Typography>
          <Box
            display="grid"
            gridTemplateColumns={{
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(4, 1fr)',
              lg: 'repeat(6, 1fr)'
            }}
            gap={2}
          >
            {getCurrentSubfolders().map((folder) => (
              <Card
                key={folder.id}
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: `2px solid #4facfe40`,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    borderColor: '#4facfe',
                  }
                }}
                onClick={() => navigateToFolder(folder)}
                onContextMenu={(event) => handleFolderContextMenu(event, folder)}
              >
                <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                  <Folder sx={{ fontSize: 40, color: '#4facfe', mb: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {folder.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(folder.subfolder_count || 0) + (folder.document_count || 0)} items
                  </Typography>
                </Box>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {/* Notes Section */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Documents ({getCurrentFolderNotes().length})
        </Typography>
      </Box>

      <Box
        display="grid"
        gridTemplateColumns={{
          xs: 'repeat(1, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(4, 1fr)'
        }}
        gap={3}
      >
        {getCurrentFolderNotes().map((document) => (
          <Card
            key={document.id}
            sx={{
              height: '280px', // Fixed height for consistency
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
              border: '1px solid',
              borderColor: document.processing_status === 'completed' ? 'success.light' :
                         document.processing_status === 'failed' ? 'error.light' : 'warning.light',
              borderLeft: `4px solid ${document.processing_status === 'completed' ? '#4facfe' :
                                      document.processing_status === 'failed' ? '#f44336' : '#ff9800'}`,
              background: document.processing_status === 'completed' ?
                         'linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)' :
                         document.processing_status === 'failed' ?
                         'linear-gradient(135deg, #ffffff 0%, #fff5f5 100%)' :
                         'linear-gradient(135deg, #ffffff 0%, #fffbf0 100%)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(79, 172, 254, 0.15)',
                borderColor: document.processing_status === 'completed' ? '#4facfe' :
                           document.processing_status === 'failed' ? '#f44336' : '#ff9800',
              },
              '&:before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: document.processing_status === 'completed' ?
                           'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)' :
                           document.processing_status === 'failed' ?
                           'linear-gradient(90deg, #f44336 0%, #ff6b6b 100%)' :
                           'linear-gradient(90deg, #ff9800 0%, #ffb74d 100%)',
                opacity: 0,
                transition: 'opacity 0.3s ease',
              },
              '&:hover:before': {
                opacity: 1,
              }
            }}
            onClick={() => setSelectedNote(document as any)}
          >
            <CardContent
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <Box>
                {/* Header with icon, title and status */}
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box display="flex" alignItems="flex-start" gap={1.5} flex={1} minWidth={0}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 1.5,
                        backgroundColor: document.processing_status === 'completed' ? 'primary.50' :
                                       document.processing_status === 'failed' ? 'error.50' : 'warning.50',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <PictureAsPdf
                        sx={{
                          color: document.processing_status === 'completed' ? '#4facfe' :
                                 document.processing_status === 'failed' ? '#f44336' : '#ff9800',
                          fontSize: 20
                        }}
                      />
                    </Box>
                    <Box flex={1} minWidth={0}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          fontSize: '1.1rem',
                          lineHeight: 1.3,
                          mb: 0.5,
                          wordBreak: 'break-word',
                          hyphens: 'auto',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                        title={document.title} // Tooltip for full title
                      >
                        {document.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <Folder sx={{ fontSize: 12, flexShrink: 0 }} />
                        {document.folder_name || 'Root'}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ ml: 1, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getProcessingStatusChip(document.processing_status, document.id)}
                    {document.processing_status === 'failed' && (
                      <IconButton
                        size="small"
                        onClick={(e) => handleRetryProcessing(document.id, e)}
                        sx={{
                          color: 'error.main',
                          '&:hover': { backgroundColor: 'error.light', color: 'white' }
                        }}
                        title="Retry processing"
                      >
                        <Repeat sx={{ fontSize: 16 }} />
                      </IconButton>
                    )}
                  </Box>
                </Box>

                {/* Document metadata */}
                <Box
                  sx={{
                    mb: 2,
                    p: 1.5,
                    borderRadius: 1,
                    backgroundColor: 'grey.50',
                    border: '1px solid',
                    borderColor: 'grey.200'
                  }}
                >
                  <Box display="flex" flexWrap="wrap" gap={2}>
                    {document.total_pages && (
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Typography variant="caption" color="text.secondary">Pages:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                          {document.total_pages}
                        </Typography>
                      </Box>
                    )}
                    {document.section_count && (
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Typography variant="caption" color="text.secondary">Sections:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                          {document.section_count}
                        </Typography>
                      </Box>
                    )}
                    {document.file_size && (
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Typography variant="caption" color="text.secondary">Size:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                          {(document.file_size / 1024 / 1024).toFixed(1)} MB
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Processing Progress Bar */}
                {(() => {
                  const realtimeStatus = processingStatuses[document.id];
                  const shouldShowProgress = document.processing_status === 'processing' ||
                                           document.processing_status === 'pending' ||
                                           realtimeStatus?.status === 'processing';

                  if (shouldShowProgress) {
                    const progress = realtimeStatus ? calculateProgress(realtimeStatus) : 0;
                    const stageInfo = realtimeStatus?.stage ? getStageInfo(realtimeStatus.stage) : null;

                    return (
                      <Box sx={{ mb: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="caption" color="text.secondary">
                            {stageInfo ? `${stageInfo.icon} ${stageInfo.message}` : 'Processing...'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {progress}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          sx={{
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#4facfe',
                              borderRadius: 2,
                            }
                          }}
                        />
                      </Box>
                    );
                  }
                  return null;
                })()}
              </Box>

              {/* Footer with date and actions - Always at bottom */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mt="auto">
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontWeight: 500
                  }}
                >
                  Created {new Date(document.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Typography>

                <Box display="flex" alignItems="center" gap={0.5}>
                  <IconButton
                    size="small"
                    sx={{
                      color: 'text.secondary',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        color: 'primary.main'
                      }
                    }}
                  >
                    <MoreHoriz fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}

        {/* Empty State */}
        {getCurrentFolderNotes().length === 0 && !loading && (
          <Box
            grid-column="1 / -1"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            py={8}
            textAlign="center"
          >
            <CloudUpload sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No documents yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Upload PDF documents to get started with AI-powered note generation
            </Typography>
          </Box>
        )}

        {/* Loading State */}
        {loading && (
          <Box
            grid-column="1 / -1"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            py={8}
            textAlign="center"
          >
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Loading documents...
            </Typography>
          </Box>
        )}
      </Box>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000
        }}
        onClick={(event) => setFabMenuAnchor(event.currentTarget)}
      >
        <Add />
      </Fab>

      {/* FAB Menu */}
      <Menu
        anchorEl={fabMenuAnchor}
        open={Boolean(fabMenuAnchor)}
        onClose={() => setFabMenuAnchor(null)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <MenuItem
          onClick={() => {
            setUploadType('pdf');
            setShowUploadDialog(true);
            setFabMenuAnchor(null);
          }}
        >
          <ListItemIcon>
            <PictureAsPdf />
          </ListItemIcon>
          <ListItemText>Upload PDF</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setUploadType('audio');
            setShowUploadDialog(true);
            setFabMenuAnchor(null);
          }}
          disabled
        >
          <ListItemIcon>
            <AudioFile />
          </ListItemIcon>
          <ListItemText>Upload Audio (Coming Soon)</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setUploadType('youtube');
            setShowUploadDialog(true);
            setFabMenuAnchor(null);
          }}
          disabled
        >
          <ListItemIcon>
            <YouTube />
          </ListItemIcon>
          <ListItemText>Add YouTube Video (Coming Soon)</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create Folder Dialog */}
      <Dialog
        open={showCreateFolderDialog}
        onClose={() => setShowCreateFolderDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Folder Name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            sx={{ mt: 2 }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateFolder();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateFolderDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateFolder}
            variant="contained"
            disabled={!newFolderName.trim() || loading}
          >
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Upload Content
          {currentFolder && (
            <Typography variant="body2" color="text.secondary">
              to {currentFolder.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {uploadType === 'youtube' ? (
            <TextField
              autoFocus
              fullWidth
              label="YouTube URL"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              sx={{ mt: 2 }}
            />
          ) : (
            <Box>
              <input
                type="file"
                id="file-upload"
                style={{ display: 'none' }}
                accept={uploadType === 'pdf' ? '.pdf' : '.mp3,.wav,.m4a,.ogg'}
                onChange={handleFileUpload}
              />
              <label htmlFor="file-upload">
                <Button
                  component="span"
                  variant="outlined"
                  fullWidth
                  sx={{ mt: 2, py: 2 }}
                  startIcon={<CloudUpload />}
                >
                  Choose {uploadType.toUpperCase()} File
                </Button>
              </label>
              {uploadFile && (
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Selected: {uploadFile.name}
                </Typography>
              )}
            </Box>
          )}

          {isUploading && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Processing... {uploadProgress}%
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUploadDialog(false)} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={
              isUploading ||
              (uploadType === 'youtube' ? !youtubeUrl.trim() : !uploadFile)
            }
          >
            {isUploading ? 'Processing...' : 'Upload & Process'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu for Folders */}
      <Menu
        open={folderContextMenu !== null}
        onClose={handleCloseFolderContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          folderContextMenu !== null
            ? { top: folderContextMenu.mouseY, left: folderContextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem
          onClick={() => {
            setSelectedFolderForAction(folderContextMenu!.folder);
            setRenameFolderName(folderContextMenu!.folder.name);
            setShowRenameFolderDialog(true);
            handleCloseFolderContextMenu();
          }}
        >
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setSelectedFolderForAction(folderContextMenu!.folder);
            setShowDeleteFolderDialog(true);
            handleCloseFolderContextMenu();
          }}
        >
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Rename Folder Dialog */}
      <Dialog
        open={showRenameFolderDialog}
        onClose={() => setShowRenameFolderDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Rename Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Folder Name"
            value={renameFolderName}
            onChange={(e) => setRenameFolderName(e.target.value)}
            sx={{ mt: 2 }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleRenameFolder();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRenameFolderDialog(false)}>Cancel</Button>
          <Button
            onClick={handleRenameFolder}
            variant="contained"
            disabled={!renameFolderName.trim() || loading}
          >
            {loading ? 'Renaming...' : 'Rename'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Folder Dialog */}
      <Dialog
        open={showDeleteFolderDialog}
        onClose={() => setShowDeleteFolderDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Folder</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete &quot;{selectedFolderForAction?.name}&quot;?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone. All contents will be moved to the parent folder.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteFolderDialog(false)}>Cancel</Button>
          <Button
            onClick={() => handleDeleteFolder(false)}
            color="error"
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
          <Button
            onClick={() => handleDeleteFolder(true)}
            color="error"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Force Deleting...' : 'Force Delete'}
          </Button>
        </DialogActions>
      </Dialog>


      {/* Edit Note Dialog - Only render on client to avoid hydration issues */}
      {isClient && (
        <Dialog
          open={showEditNoteDialog}
        onClose={() => setShowEditNoteDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Note</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Note Title"
            type="text"
            fullWidth
            variant="outlined"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Note Content"
            multiline
            rows={6}
            fullWidth
            variant="outlined"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditNoteDialog(false)}>Cancel</Button>
          <Button
            onClick={submitEditNote}
            variant="contained"
            disabled={!noteTitle.trim() || !noteContent.trim() || loading}
          >
            {loading ? 'Updating...' : 'Update Note'}
          </Button>
        </DialogActions>
        </Dialog>
      )}

      {/* Delete Note Dialog */}
      <Dialog
        open={showDeleteNoteDialog}
        onClose={() => setShowDeleteNoteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Note</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the note &quot;{selectedNoteForDelete?.title}&quot;?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteNoteDialog(false)}>Cancel</Button>
          <Button
            onClick={submitDeleteNote}
            color="error"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Flashcard Dialog */}
      {isClient && (
        <Dialog
          open={showCreateFlashcardDialog}
          onClose={() => {
            setShowCreateFlashcardDialog(false);
            resetFlashcardForm();
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <Style sx={{ color: '#4facfe' }} />
              Create New Flashcard
              {selectedSection && (
                <Chip
                  label={selectedSection.title}
                  size="small"
                  sx={{ ml: 'auto', backgroundColor: '#4facfe20', color: '#4facfe' }}
                />
              )}
            </Box>
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Front Text"
              type="text"
              fullWidth
              variant="outlined"
              value={flashcardFrontText}
              onChange={(e) => setFlashcardFrontText(e.target.value)}
              placeholder="Question, term, or concept"
              sx={{ mb: 2 }}
              error={flashcardFrontText.length > 500}
              helperText={`${flashcardFrontText.length}/500 characters`}
            />
            <TextField
              margin="dense"
              label="Back Text"
              multiline
              rows={4}
              fullWidth
              variant="outlined"
              value={flashcardBackText}
              onChange={(e) => setFlashcardBackText(e.target.value)}
              placeholder="Answer, definition, or explanation"
              sx={{ mb: 2 }}
              error={flashcardBackText.length > 1000}
              helperText={`${flashcardBackText.length}/1000 characters`}
            />
            <FormControl fullWidth>
              <InputLabel>Difficulty Level</InputLabel>
              <Select
                value={flashcardDifficulty}
                label="Difficulty Level"
                onChange={(e) => setFlashcardDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
              >
                <MenuItem value="easy">Easy</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="hard">Hard</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setShowCreateFlashcardDialog(false);
              resetFlashcardForm();
            }}>Cancel</Button>
            <Button
              onClick={submitCreateFlashcard}
              variant="contained"
              disabled={!flashcardFrontText.trim() || !flashcardBackText.trim() || isCreatingFlashcard}
              startIcon={isCreatingFlashcard ? <CircularProgress size={16} /> : <Save />}
            >
              {isCreatingFlashcard ? 'Creating...' : 'Create Flashcard'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Edit Flashcard Dialog */}
      {isClient && (
        <Dialog
          open={showEditFlashcardDialog}
          onClose={() => {
            setShowEditFlashcardDialog(false);
            resetFlashcardForm();
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <Edit sx={{ color: '#4facfe' }} />
              Edit Flashcard
            </Box>
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Front Text"
              type="text"
              fullWidth
              variant="outlined"
              value={flashcardFrontText}
              onChange={(e) => setFlashcardFrontText(e.target.value)}
              placeholder="Question, term, or concept"
              sx={{ mb: 2 }}
              error={flashcardFrontText.length > 500}
              helperText={`${flashcardFrontText.length}/500 characters`}
            />
            <TextField
              margin="dense"
              label="Back Text"
              multiline
              rows={4}
              fullWidth
              variant="outlined"
              value={flashcardBackText}
              onChange={(e) => setFlashcardBackText(e.target.value)}
              placeholder="Answer, definition, or explanation"
              sx={{ mb: 2 }}
              error={flashcardBackText.length > 1000}
              helperText={`${flashcardBackText.length}/1000 characters`}
            />
            <FormControl fullWidth>
              <InputLabel>Difficulty Level</InputLabel>
              <Select
                value={flashcardDifficulty}
                label="Difficulty Level"
                onChange={(e) => setFlashcardDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
              >
                <MenuItem value="easy">Easy</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="hard">Hard</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setShowEditFlashcardDialog(false);
              resetFlashcardForm();
            }}>Cancel</Button>
            <Button
              onClick={submitEditFlashcard}
              variant="contained"
              disabled={!flashcardFrontText.trim() || !flashcardBackText.trim() || isCreatingFlashcard}
              startIcon={isCreatingFlashcard ? <CircularProgress size={16} /> : <Save />}
            >
              {isCreatingFlashcard ? 'Updating...' : 'Update Flashcard'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Bulk Create Flashcards Dialog */}
      {isClient && (
        <Dialog
          open={showBulkCreateDialog}
          onClose={() => {
            setShowBulkCreateDialog(false);
            resetBulkFlashcardForm();
          }}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <Style sx={{ color: '#4facfe' }} />
              Bulk Create Flashcards
              {selectedSection && (
                <Chip
                  label={selectedSection.title}
                  size="small"
                  sx={{ ml: 'auto', backgroundColor: '#4facfe20', color: '#4facfe' }}
                />
              )}
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create multiple flashcards at once. Maximum 50 flashcards can be created in a single batch.
            </Typography>

            {bulkFlashcards.map((card, index) => (
              <Paper key={index} sx={{ p: 3, mb: 2, position: 'relative' }}>
                {bulkFlashcards.length > 1 && (
                  <IconButton
                    onClick={() => {
                      const updated = bulkFlashcards.filter((_, i) => i !== index);
                      setBulkFlashcards(updated);
                    }}
                    sx={{ position: 'absolute', top: 8, right: 8, color: 'error.main' }}
                    size="small"
                  >
                    <Delete />
                  </IconButton>
                )}

                <Typography variant="h6" sx={{ mb: 2, pr: 5 }}>
                  Flashcard {index + 1}
                </Typography>

                <TextField
                  fullWidth
                  label="Front Text"
                  value={card.front_text}
                  onChange={(e) => {
                    const updated = [...bulkFlashcards];
                    updated[index].front_text = e.target.value;
                    setBulkFlashcards(updated);
                  }}
                  placeholder="Question, term, or concept"
                  sx={{ mb: 2 }}
                  error={card.front_text.length > 500}
                  helperText={`${card.front_text.length}/500 characters`}
                />

                <TextField
                  fullWidth
                  label="Back Text"
                  multiline
                  rows={3}
                  value={card.back_text}
                  onChange={(e) => {
                    const updated = [...bulkFlashcards];
                    updated[index].back_text = e.target.value;
                    setBulkFlashcards(updated);
                  }}
                  placeholder="Answer, definition, or explanation"
                  sx={{ mb: 2 }}
                  error={card.back_text.length > 1000}
                  helperText={`${card.back_text.length}/1000 characters`}
                />

                <FormControl fullWidth sx={{ minWidth: 150 }}>
                  <InputLabel>Difficulty</InputLabel>
                  <Select
                    value={card.difficulty_level}
                    label="Difficulty"
                    onChange={(e) => {
                      const updated = [...bulkFlashcards];
                      updated[index].difficulty_level = e.target.value as 'easy' | 'medium' | 'hard';
                      setBulkFlashcards(updated);
                    }}
                  >
                    <MenuItem value="easy">Easy</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="hard">Hard</MenuItem>
                  </Select>
                </FormControl>
              </Paper>
            ))}

            <Box display="flex" justifyContent="center" mt={3}>
              <Button
                startIcon={<Add />}
                onClick={() => {
                  if (bulkFlashcards.length < 50) {
                    setBulkFlashcards([...bulkFlashcards, {
                      front_text: '',
                      back_text: '',
                      difficulty_level: 'medium'
                    }]);
                  } else {
                    toast.error('Maximum 50 flashcards allowed');
                  }
                }}
                disabled={bulkFlashcards.length >= 50}
              >
                Add Another Flashcard
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setShowBulkCreateDialog(false);
              resetBulkFlashcardForm();
            }}>Cancel</Button>
            <Button
              onClick={submitBulkCreateFlashcards}
              variant="contained"
              disabled={isCreatingFlashcard || bulkFlashcards.every(card => !card.front_text.trim() || !card.back_text.trim())}
              startIcon={isCreatingFlashcard ? <CircularProgress size={16} /> : <Save />}
            >
              {isCreatingFlashcard ? 'Creating...' : `Create ${bulkFlashcards.filter(card => card.front_text.trim() && card.back_text.trim()).length} Flashcards`}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );

  const renderNoteDetail = () => {
    if (!selectedNote) return null;

    const sectionDetailTabs = [
      { label: 'Notes', value: 'notes', icon: <StickyNote2 /> },
      { label: 'Quiz', value: 'quiz', icon: <Quiz /> },
      { label: 'Flashcards', value: 'flashcards', icon: <Style /> },
      { label: 'Edufeed', value: 'edufeed', icon: <RssFeed /> },
    ];

    // Get all quiz questions from the quiz data
    const getAllQuizQuestions = () => {
      if (!sectionQuiz?.questions) return [];

      const allQuestions: any[] = [];

      // Add multiple choice questions
      if (sectionQuiz.questions.multiple_choice) {
        sectionQuiz.questions.multiple_choice.forEach((q, index) => {
          allQuestions.push({
            key: `mc_${index}`,
            type: 'multiple_choice',
            ...q
          });
        });
      }

      // Add true/false questions
      if (sectionQuiz.questions.true_false) {
        sectionQuiz.questions.true_false.forEach((q, index) => {
          allQuestions.push({
            key: `tf_${index}`,
            type: 'true_false',
            ...q,
            options: ['True', 'False']
          });
        });
      }

      // Add fill in the blank questions
      if (sectionQuiz.questions.fill_in_blank) {
        sectionQuiz.questions.fill_in_blank.forEach((q, index) => {
          allQuestions.push({
            key: `fib_${index}`,
            type: 'fill_in_blank',
            ...q
          });
        });
      }

      // Add short answer questions
      if (sectionQuiz.questions.short_answer) {
        sectionQuiz.questions.short_answer.forEach((q, index) => {
          allQuestions.push({
            key: `sa_${index}`,
            type: 'short_answer',
            ...q
          });
        });
      }

      return allQuestions;
    };

    const quizQuestions = getAllQuizQuestions();

    const flashcards = [
      {
        id: 1,
        front: "What is the main goal for Q1?",
        back: "Focus on feature releases and API improvements with enhanced user authentication"
      },
      {
        id: 2,
        front: "Key areas for improvement",
        back: "API enhancements, user authentication, and upcoming feature releases"
      },
      {
        id: 3,
        front: "Follow-up actions",
        back: "User authentication enhancements and API improvement implementation"
      }
    ];

    const edufeedPosts = [
      {
        id: 1,
        author: {
          name: "Dr. Sarah Chen",
          username: "@sarahtech",
          avatar: "/api/placeholder/40/40",
          verified: true
        },
        content: "Just published a comprehensive guide on API design patterns! 🚀 Key takeaways: REST vs GraphQL, authentication strategies, and rate limiting best practices. Essential reading for backend developers. #APIDesign #WebDev",
        timestamp: "2h",
        likes: 156,
        retweets: 23,
        comments: [
          {
            id: 101,
            author: {
              name: "Mike Johnson",
              username: "@mikecodes",
              avatar: "/api/placeholder/32/32"
            },
            content: "This is exactly what I needed for my current project! Thanks for sharing.",
            timestamp: "1h",
            likes: 12
          },
          {
            id: 102,
            author: {
              name: "Emily Rodriguez",
              username: "@emilydev",
              avatar: "/api/placeholder/32/32"
            },
            content: "The section on rate limiting was particularly helpful. Do you have any recommendations for production-ready rate limiting libraries?",
            timestamp: "45m",
            likes: 8
          }
        ],
        hashtags: ["#APIDesign", "#WebDev", "#BackendDev"]
      },
      {
        id: 2,
        author: {
          name: "TechEdu Academy",
          username: "@techedu",
          avatar: "/api/placeholder/40/40",
          verified: true
        },
        content: "🎯 Project Management Tips for Developers:\n\n1. Break large features into smaller tasks\n2. Use timeboxing for research phases\n3. Regular stakeholder check-ins\n4. Document decisions and rationale\n\nWhat's your favorite PM technique? 👇",
        timestamp: "4h",
        likes: 89,
        retweets: 45,
        comments: [
          {
            id: 201,
            author: {
              name: "Alex Kim",
              username: "@alexbuilds",
              avatar: "/api/placeholder/32/32"
            },
            content: "Kanban boards have been a game-changer for our team. Visual progress tracking is so motivating!",
            timestamp: "3h",
            likes: 15
          },
          {
            id: 202,
            author: {
              name: "Sarah Dev",
              username: "@sarahcodes",
              avatar: "/api/placeholder/32/32"
            },
            content: "Love the timeboxing tip! I set 2-hour limits for research tasks to avoid rabbit holes.",
            timestamp: "2h",
            likes: 22
          },
          {
            id: 203,
            author: {
              name: "Dev Team Lead",
              username: "@teamlead",
              avatar: "/api/placeholder/32/32"
            },
            content: "Daily standups with clear blockers discussion has improved our velocity by 30%",
            timestamp: "1h",
            likes: 18
          }
        ],
        hashtags: ["#ProjectManagement", "#Productivity", "#DevTeam"]
      },
      {
        id: 3,
        author: {
          name: "CyberSec Weekly",
          username: "@cybersecweekly",
          avatar: "/api/placeholder/40/40",
          verified: true
        },
        content: "🔐 User Authentication Security Alert! \n\nNew vulnerabilities discovered in common auth libraries. Here's what you need to know:\n\n• Multi-factor authentication is non-negotiable\n• Session management best practices\n• Password security guidelines\n\nFull thread below 🧵",
        timestamp: "6h",
        likes: 234,
        retweets: 87,
        comments: [
          {
            id: 301,
            author: {
              name: "Security Expert",
              username: "@securitypro",
              avatar: "/api/placeholder/32/32"
            },
            content: "Great timing on this post! Just implemented 2FA in our app last week. The user adoption has been surprisingly high.",
            timestamp: "5h",
            likes: 25
          },
          {
            id: 302,
            author: {
              name: "Jane Developer",
              username: "@janedev",
              avatar: "/api/placeholder/32/32"
            },
            content: "Which auth libraries were affected? Need to check our dependencies ASAP.",
            timestamp: "4h",
            likes: 31
          }
        ],
        hashtags: ["#CyberSecurity", "#Authentication", "#WebSecurity"]
      },
      {
        id: 4,
        author: {
          name: "Code Academy",
          username: "@codeacademy",
          avatar: "/api/placeholder/40/40",
          verified: true
        },
        content: "💡 Learning tip of the day: The Feynman Technique for understanding complex programming concepts.\n\n1. Choose a concept\n2. Explain it in simple terms\n3. Identify gaps in understanding\n4. Review and simplify\n\nTry explaining your current project to a non-developer! 🤔",
        timestamp: "8h",
        likes: 445,
        retweets: 156,
        comments: [
          {
            id: 401,
            author: {
              name: "Student Coder",
              username: "@studentdev",
              avatar: "/api/placeholder/32/32"
            },
            content: "This technique helped me finally understand React hooks! Explained them to my mom and found so many gaps in my knowledge.",
            timestamp: "7h",
            likes: 42
          }
        ],
        hashtags: ["#LearningTips", "#Programming", "#Education"]
      }
    ];



    const renderNotesTab = () => (
      <Box sx={{ p: 3 }}>
        {/* Document Header */}
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Box
            sx={{
              width: 8,
              height: 40,
              backgroundColor: '#4facfe',
              borderRadius: 1
            }}
          />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              {selectedNote.title}
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip
                label={selectedNote.folder_name || 'No folder'}
                sx={{
                  backgroundColor: '#4facfe20',
                  color: '#4facfe',
                  fontWeight: 'medium'
                }}
              />
              {getProcessingStatusChip(selectedNote.processing_status, selectedNote.id)}
            </Box>
          </Box>
        </Box>

        {/* Document Info */}
        <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f8f9fa' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Document Information
          </Typography>
          <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={2}>
            {selectedNote.total_pages && (
              <Box>
                <Typography variant="caption" color="text.secondary">Pages</Typography>
                <Typography variant="body1">{selectedNote.total_pages}</Typography>
              </Box>
            )}
            {selectedNote.section_count && (
              <Box>
                <Typography variant="caption" color="text.secondary">Sections</Typography>
                <Typography variant="body1">{selectedNote.section_count}</Typography>
              </Box>
            )}
            {selectedNote.file_size && (
              <Box>
                <Typography variant="caption" color="text.secondary">File Size</Typography>
                <Typography variant="body1">{(selectedNote.file_size / 1024 / 1024).toFixed(1)} MB</Typography>
              </Box>
            )}
            <Box>
              <Typography variant="caption" color="text.secondary">Processing Status</Typography>
              <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                {selectedNote.processing_status}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Document Sections */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Document Sections
            </Typography>
            {sectionsLoading && <CircularProgress size={20} />}
          </Box>

          {sectionsLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : documentSections.length > 0 ? (
            <Box display="flex" flexDirection="column" gap={2}>
              {documentSections.map((section, index) => (
                <Card
                  key={section.id}
                  sx={{
                    cursor: 'pointer',
                    border: selectedSection?.id === section.id ? `2px solid #4facfe` : '1px solid #e0e0e0',
                    '&:hover': {
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }
                  }}
                  onClick={() => setSelectedSection(section)}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box flex={1}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
                          {section.title}
                        </Typography>
                        <Box display="flex" gap={2} flexWrap="wrap">
                          <Typography variant="caption" color="text.secondary">
                            Section {section.section_order + 1}
                          </Typography>
                          {section.content_length && (
                            <Typography variant="caption" color="text.secondary">
                              {section.content_length} characters
                            </Typography>
                          )}
                          {section.notes_count !== undefined && (
                            <Typography variant="caption" color="text.secondary">
                              {section.notes_count} notes
                            </Typography>
                          )}
                          {section.quiz_count !== undefined && (
                            <Typography variant="caption" color="text.secondary">
                              {section.quiz_count} quizzes
                            </Typography>
                          )}
                          {section.flashcards_count !== undefined && (
                            <Typography variant="caption" color="text.secondary">
                              {section.flashcards_count} flashcards
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getProcessingStatusChip(section.processing_status, section.id)}
                        <IconButton size="small">
                          <NavigateNext />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" alignItems="center" py={4}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                No sections available
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedNote.processing_status === 'completed'
                  ? 'This document has no processed sections'
                  : 'Document is still processing'}
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Selected Section Content */}
        {selectedSection && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              {selectedSection.title}
            </Typography>
            {selectedSection.content ? (
              <Typography variant="body1" sx={{ lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                {selectedSection.content}
              </Typography>
            ) : (
              <Box display="flex" justifyContent="center" py={4}>
                <Button
                  variant="outlined"
                  onClick={() => loadSectionContent(selectedNote.id, selectedSection.id)}
                >
                  Load Section Content
                </Button>
              </Box>
            )}
          </Paper>
        )}

        <Typography variant="caption" color="text.secondary">
          Created: {new Date(selectedNote.created_at).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Typography>
      </Box>
    );

    const renderQuizTab = () => {
      if (!selectedSection) return null;

      if (contentLoading) {
        return (
          <Box display="flex" flexDirection="column" alignItems="center" py={6}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Loading quiz...
            </Typography>
          </Box>
        );
      }

      if (!sectionQuiz) {
        return (
          <Box display="flex" flexDirection="column" alignItems="center" py={6}>
            <Quiz sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No quiz available
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              This section doesn&apos;t have a quiz yet
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateQuiz}
              sx={{
                background: 'linear-gradient(45deg, #4facfe 30%, #00f2fe 90%)',
                color: 'white',
                fontWeight: 'bold',
                px: 3,
                py: 1
              }}
            >
              Add Quiz
            </Button>
          </Box>
        );
      }

      return (
        <>
          <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {sectionQuiz.title}
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={handleCreateQuiz}
                sx={{
                  borderColor: '#4facfe',
                  color: '#4facfe',
                  '&:hover': {
                    borderColor: '#4facfe',
                    backgroundColor: '#4facfe10'
                  }
                }}
              >
                Add Questions
              </Button>
            </Box>

          {!showResults ? (
          <Box>
            <LinearProgress
              variant="determinate"
              value={(Object.keys(selectedAnswers).length / quizQuestions.length) * 100}
              sx={{ mb: 3, height: 8, borderRadius: 4 }}
            />

            {quizQuestions.map((question, index) => (
              <Paper key={question.key} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {index + 1}. {question.question}
                </Typography>

                {question.type === 'multiple_choice' || question.type === 'true_false' ? (
                  <RadioGroup
                    value={selectedAnswers[question.key] ?? ''}
                    onChange={(e) => handleQuizAnswer(question.key, parseInt(e.target.value as string))}
                  >
                    {question.options?.map((option: string, optionIndex: number) => (
                      <FormControlLabel
                        key={optionIndex}
                        value={optionIndex}
                        control={<Radio />}
                        label={option}
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </RadioGroup>
                ) : question.type === 'fill_in_blank' || question.type === 'short_answer' ? (
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder={question.type === 'fill_in_blank' ? 'Fill in the blank...' : 'Your answer...'}
                    value={selectedAnswers[question.key] ?? ''}
                    onChange={(e) => handleQuizAnswer(question.key, e.target.value)}
                    multiline={question.type === 'short_answer'}
                    rows={question.type === 'short_answer' ? 3 : 1}
                  />
                ) : null}
              </Paper>
            ))}

            <Button
              variant="contained"
              onClick={submitQuiz}
              disabled={Object.keys(selectedAnswers).length !== quizQuestions.length}
              sx={{ mt: 2 }}
            >
              Submit Quiz
            </Button>
          </Box>
        ) : (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: 'success.main' }}>
              Quiz Results
            </Typography>

            {quizResults && (
              <Paper sx={{ p: 3, mb: 3, bgcolor: 'success.50' }}>
                <Typography variant="h5" sx={{ mb: 1 }}>
                  Score: {quizResults.score}/{quizResults.max_score} ({quizResults.percentage}%)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Great job completing the quiz!
                </Typography>
              </Paper>
            )}

            {quizQuestions.map((question, index) => {
              const userAnswer = selectedAnswers[question.key];

              // For multiple choice and true/false, check if answer matches correct_answer index
              let isCorrect = false;
              let correctAnswerText = '';
              let userAnswerText = '';

              if (question.type === 'multiple_choice' || question.type === 'true_false') {
                isCorrect = userAnswer === question.correct_answer;
                userAnswerText = question.options?.[userAnswer as number] || '';
                correctAnswerText = question.options?.[question.correct_answer as number] || '';
              } else {
                // For text-based questions, we'd need the detailed results from API
                userAnswerText = String(userAnswer || '');
                correctAnswerText = question.sample_answer || '';
                // For now, assume text answers are "correct" since we can't easily validate
                isCorrect = true;
              }

              return (
                <Paper key={question.key} sx={{ p: 3, mb: 3 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    {isCorrect ? (
                      <CheckCircle color="success" />
                    ) : (
                      <RadioButtonUnchecked color="error" />
                    )}
                    <Typography variant="h6">
                      {index + 1}. {question.question}
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Your answer: {userAnswerText} {isCorrect ? '✓' : '✗'}
                  </Typography>

                  {!isCorrect && correctAnswerText && (
                    <Typography variant="body2" color="success.main" sx={{ mb: 2 }}>
                      Correct answer: {correctAnswerText}
                    </Typography>
                  )}

                  {question.explanation && (
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                      {question.explanation}
                    </Typography>
                  )}

                  {question.sample_answer && question.type !== 'multiple_choice' && question.type !== 'true_false' && (
                    <Typography variant="body2" color="info.main" sx={{ mt: 1 }}>
                      Sample answer: {question.sample_answer}
                    </Typography>
                  )}
                </Paper>
              );
            })}

            <Button variant="outlined" onClick={() => {
              setShowResults(false);
              setSelectedAnswers({});
              setQuizResults(null);
            }}>
              Retake Quiz
            </Button>
          </Box>
        )}
          </Box>

          {/* Create Quiz Dialog - Local to Quiz tab for proper rendering */}
          {isClient && (
            <Dialog
              open={showCreateQuizDialog}
              onClose={() => setShowCreateQuizDialog(false)}
              maxWidth="lg"
              fullWidth
              scroll="paper"
            >
              <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                  <Quiz sx={{ color: '#4facfe' }} />
                  {isEditingQuiz ? 'Edit Quiz & Add Questions' : 'Create New Quiz'}
                  {selectedSection && (
                    <Chip
                      label={selectedSection.title}
                      size="small"
                      sx={{ ml: 'auto', backgroundColor: '#4facfe20', color: '#4facfe' }}
                    />
                  )}
                </Box>
              </DialogTitle>
              <DialogContent>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Quiz Title"
                  fullWidth
                  variant="outlined"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="Enter a title for your quiz"
                  sx={{ mb: 3 }}
                />

                <Tabs value={0} sx={{ mb: 3 }}>
                  <Tab label="Multiple Choice" />
                  <Tab label="True/False" />
                  <Tab label="Fill in Blank" />
                  <Tab label="Short Answer" />
                </Tabs>

                {/* Multiple Choice Questions */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RadioButtonUnchecked sx={{ fontSize: 20 }} />
                    Multiple Choice Questions
                  </Typography>
                  {multipleChoiceQuestions.map((question, index) => (
                    <Paper key={index} sx={{ p: 3, mb: 2, position: 'relative' }}>
                      {multipleChoiceQuestions.length > 1 && (
                        <IconButton
                          onClick={() => {
                            const updated = multipleChoiceQuestions.filter((_, i) => i !== index);
                            setMultipleChoiceQuestions(updated);
                          }}
                          sx={{ position: 'absolute', top: 8, right: 8, color: 'error.main' }}
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                      )}
                      <TextField
                        fullWidth
                        label={`Question ${index + 1}`}
                        value={question.question}
                        onChange={(e) => {
                          const updated = [...multipleChoiceQuestions];
                          updated[index].question = e.target.value;
                          setMultipleChoiceQuestions(updated);
                        }}
                        sx={{ mb: 2, pr: 5 }}
                      />
                      {question.options.map((option, optIndex) => (
                        <TextField
                          key={optIndex}
                          fullWidth
                          label={`Option ${optIndex + 1}`}
                          value={option}
                          onChange={(e) => {
                            const updated = [...multipleChoiceQuestions];
                            updated[index].options[optIndex] = e.target.value;
                            setMultipleChoiceQuestions(updated);
                          }}
                          sx={{ mb: 1 }}
                          InputProps={{
                            startAdornment: (
                              <Radio
                                checked={question.correct_answer === optIndex}
                                onChange={() => {
                                  const updated = [...multipleChoiceQuestions];
                                  updated[index].correct_answer = optIndex;
                                  setMultipleChoiceQuestions(updated);
                                }}
                                sx={{ mr: 1 }}
                              />
                            )
                          }}
                        />
                      ))}
                      <TextField
                        fullWidth
                        label="Explanation (Optional)"
                        value={question.explanation}
                        onChange={(e) => {
                          const updated = [...multipleChoiceQuestions];
                          updated[index].explanation = e.target.value;
                          setMultipleChoiceQuestions(updated);
                        }}
                        sx={{ mt: 1 }}
                      />
                    </Paper>
                  ))}
                  <Button
                    startIcon={<Add />}
                    onClick={() => setMultipleChoiceQuestions([...multipleChoiceQuestions, {
                      question: '',
                      options: ['', '', '', ''],
                      correct_answer: 0,
                      explanation: ''
                    }])}
                  >
                    Add Multiple Choice Question
                  </Button>
                </Box>

                {/* True/False Questions */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle sx={{ fontSize: 20 }} />
                    True/False Questions
                  </Typography>
                  {trueFalseQuestions.map((question, index) => (
                    <Paper key={index} sx={{ p: 3, mb: 2, position: 'relative' }}>
                      {trueFalseQuestions.length > 1 && (
                        <IconButton
                          onClick={() => {
                            const updated = trueFalseQuestions.filter((_, i) => i !== index);
                            setTrueFalseQuestions(updated);
                          }}
                          sx={{ position: 'absolute', top: 8, right: 8, color: 'error.main' }}
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                      )}
                      <TextField
                        fullWidth
                        label={`Question ${index + 1}`}
                        value={question.question}
                        onChange={(e) => {
                          const updated = [...trueFalseQuestions];
                          updated[index].question = e.target.value;
                          setTrueFalseQuestions(updated);
                        }}
                        sx={{ mb: 2, pr: 5 }}
                      />
                      <FormControl sx={{ mb: 2 }}>
                        <RadioGroup
                          row
                          value={question.answer}
                          onChange={(e) => {
                            const updated = [...trueFalseQuestions];
                            updated[index].answer = e.target.value === 'true';
                            setTrueFalseQuestions(updated);
                          }}
                        >
                          <FormControlLabel value={true} control={<Radio />} label="True" />
                          <FormControlLabel value={false} control={<Radio />} label="False" />
                        </RadioGroup>
                      </FormControl>
                      <TextField
                        fullWidth
                        label="Explanation (Optional)"
                        value={question.explanation}
                        onChange={(e) => {
                          const updated = [...trueFalseQuestions];
                          updated[index].explanation = e.target.value;
                          setTrueFalseQuestions(updated);
                        }}
                      />
                    </Paper>
                  ))}
                  <Button
                    startIcon={<Add />}
                    onClick={() => setTrueFalseQuestions([...trueFalseQuestions, {
                      question: '',
                      answer: true,
                      explanation: ''
                    }])}
                  >
                    Add True/False Question
                  </Button>
                </Box>

                {/* Fill in Blank Questions */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Edit sx={{ fontSize: 20 }} />
                    Fill in the Blank Questions
                  </Typography>
                  {fillInBlankQuestions.map((question, index) => (
                    <Paper key={index} sx={{ p: 3, mb: 2, position: 'relative' }}>
                      {fillInBlankQuestions.length > 1 && (
                        <IconButton
                          onClick={() => {
                            const updated = fillInBlankQuestions.filter((_, i) => i !== index);
                            setFillInBlankQuestions(updated);
                          }}
                          sx={{ position: 'absolute', top: 8, right: 8, color: 'error.main' }}
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                      )}
                      <TextField
                        fullWidth
                        label={`Question ${index + 1}`}
                        value={question.question}
                        placeholder="Use _____ for the blank (e.g., 'The capital of France is _____')"
                        onChange={(e) => {
                          const updated = [...fillInBlankQuestions];
                          updated[index].question = e.target.value;
                          setFillInBlankQuestions(updated);
                        }}
                        sx={{ mb: 2, pr: 5 }}
                      />
                      <TextField
                        fullWidth
                        label="Correct Answer"
                        value={question.answer}
                        onChange={(e) => {
                          const updated = [...fillInBlankQuestions];
                          updated[index].answer = e.target.value;
                          setFillInBlankQuestions(updated);
                        }}
                      />
                    </Paper>
                  ))}
                  <Button
                    startIcon={<Add />}
                    onClick={() => setFillInBlankQuestions([...fillInBlankQuestions, {
                      question: '',
                      answer: ''
                    }])}
                  >
                    Add Fill in Blank Question
                  </Button>
                </Box>

                {/* Short Answer Questions */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StickyNote2 sx={{ fontSize: 20 }} />
                    Short Answer Questions
                  </Typography>
                  {shortAnswerQuestions.map((question, index) => (
                    <Paper key={index} sx={{ p: 3, mb: 2, position: 'relative' }}>
                      {shortAnswerQuestions.length > 1 && (
                        <IconButton
                          onClick={() => {
                            const updated = shortAnswerQuestions.filter((_, i) => i !== index);
                            setShortAnswerQuestions(updated);
                          }}
                          sx={{ position: 'absolute', top: 8, right: 8, color: 'error.main' }}
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                      )}
                      <TextField
                        fullWidth
                        label={`Question ${index + 1}`}
                        value={question.question}
                        onChange={(e) => {
                          const updated = [...shortAnswerQuestions];
                          updated[index].question = e.target.value;
                          setShortAnswerQuestions(updated);
                        }}
                        sx={{ mb: 2, pr: 5 }}
                      />
                      <TextField
                        fullWidth
                        label="Sample Answer"
                        multiline
                        rows={3}
                        value={question.sample_answer}
                        onChange={(e) => {
                          const updated = [...shortAnswerQuestions];
                          updated[index].sample_answer = e.target.value;
                          setShortAnswerQuestions(updated);
                        }}
                      />
                    </Paper>
                  ))}
                  <Button
                    startIcon={<Add />}
                    onClick={() => setShortAnswerQuestions([...shortAnswerQuestions, {
                      question: '',
                      sample_answer: ''
                    }])}
                  >
                    Add Short Answer Question
                  </Button>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowCreateQuizDialog(false)}>Cancel</Button>
                <Button
                  onClick={submitCreateQuiz}
                  variant="contained"
                  disabled={!quizTitle.trim() || isCreatingQuiz}
                  startIcon={isCreatingQuiz ? <CircularProgress size={16} /> : <Save />}
                >
                  {isCreatingQuiz
                    ? (isEditingQuiz ? 'Updating...' : 'Creating...')
                    : (isEditingQuiz ? 'Update Quiz' : 'Create Quiz')
                  }
                </Button>
              </DialogActions>
            </Dialog>
          )}
        </>
      );
    };

    const renderFlashcardsTab = () => {
      if (!selectedSection) return null;

      if (contentLoading) {
        return (
          <Box display="flex" flexDirection="column" alignItems="center" py={6}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Loading flashcards...
            </Typography>
          </Box>
        );
      }

      if (!sectionFlashcards.length) {
        return (
          <Box display="flex" flexDirection="column" alignItems="center" py={6}>
            <Style sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No flashcards available
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              This section doesn&apos;t have flashcards yet
            </Typography>
            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateFlashcard}
                sx={{
                  background: 'linear-gradient(45deg, #ff6b6b 30%, #ee5a52 90%)',
                  color: 'white',
                  fontWeight: 'bold',
                  px: 3,
                  py: 1
                }}
              >
                Add Flashcard
              </Button>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={handleBulkCreate}
                sx={{
                  borderColor: '#ff6b6b',
                  color: '#ff6b6b',
                  '&:hover': {
                    borderColor: '#ff6b6b',
                    backgroundColor: '#ff6b6b10'
                  }
                }}
              >
                Bulk Create
              </Button>
            </Box>
          </Box>
        );
      }

      return (
        <>
          <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Flashcards: {selectedSection.title}
              </Typography>
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={handleCreateFlashcard}
                  sx={{
                    borderColor: '#ff6b6b',
                    color: '#ff6b6b',
                    '&:hover': {
                      borderColor: '#ff6b6b',
                      backgroundColor: '#ff6b6b10'
                    }
                  }}
                >
                  Add Flashcard
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleBulkCreate}
                  size="small"
                  sx={{
                    background: 'linear-gradient(45deg, #ff6b6b 30%, #ee5a52 90%)',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                >
                  Bulk Create
                </Button>
              </Box>
            </Box>

        <Box
          display="grid"
          gridTemplateColumns={{
            xs: 'repeat(1, 1fr)',
            md: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)'
          }}
          gap={3}
        >
          {sectionFlashcards.map((card) => (
            <Card
              key={card.id}
              sx={{
                height: 200,
                cursor: 'pointer',
                perspective: '1000px',
                '&:hover': {
                  transform: 'scale(1.02)',
                }
              }}
              onClick={() => setFlippedCards(prev => ({ ...prev, [card.id]: !prev[card.id] }))}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  transformStyle: 'preserve-3d',
                  transition: 'transform 0.6s',
                  transform: flippedCards[card.id] ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* Front of card */}
                <CardContent
                  sx={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backfaceVisibility: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, #4facfe20, #4facfe40)`,
                    border: `2px solid #4facfe60`,
                  }}
                >
                  {/* Edit/Delete buttons */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      display: 'flex',
                      gap: 0.5,
                      opacity: 0.7,
                      '&:hover': { opacity: 1 }
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditFlashcard(card);
                      }}
                      sx={{
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' }
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFlashcard(card.id);
                      }}
                      sx={{
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' }
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>

                  <Typography variant="h6" textAlign="center" sx={{ fontWeight: 'medium', px: 2 }}>
                    {card.front_text}
                  </Typography>

                  {/* Difficulty indicator */}
                  <Chip
                    label={card.difficulty_level}
                    size="small"
                    color={
                      card.difficulty_level === 'easy' ? 'success' :
                      card.difficulty_level === 'medium' ? 'warning' : 'error'
                    }
                    sx={{ mt: 1, fontSize: '0.7rem' }}
                  />
                </CardContent>

                {/* Back of card */}
                <CardContent
                  sx={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, #4facfe40, #4facfe60)`,
                    border: `2px solid #4facfe80`,
                    color: 'white',
                  }}
                >
                  <Box textAlign="center">
                    <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 2 }}>
                      {card.back_text}
                    </Typography>

                    {/* Flashcard review buttons */}
                    <Box display="flex" justifyContent="center" gap={1}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFlashcardReview(card.id, 1);
                        }}
                        sx={{ color: 'error.main' }}
                      >
                        <Typography variant="caption">😤</Typography>
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFlashcardReview(card.id, 3);
                        }}
                        sx={{ color: 'warning.main' }}
                      >
                        <Typography variant="caption">😐</Typography>
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFlashcardReview(card.id, 5);
                        }}
                        sx={{ color: 'success.main' }}
                      >
                        <Typography variant="caption">😊</Typography>
                      </IconButton>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Rate difficulty: Hard | OK | Easy
                    </Typography>
                  </Box>
                </CardContent>
              </Box>
            </Card>
          ))}
        </Box>

        <Box display="flex" justifyContent="center" mt={4}>
          <Button
            variant="outlined"
            startIcon={<FlipToFront />}
            onClick={() => setFlippedCards({})}
          >
            Reset All Cards
          </Button>
        </Box>
        </Box>
        </>
      );
    };

    const renderEdufeedTab = () => {
      if (!selectedSection) return null;

      if (contentLoading) {
        return (
          <Box display="flex" flexDirection="column" alignItems="center" py={6}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Loading edufeed...
            </Typography>
          </Box>
        );
      }

      if (!sectionPosts.length) {
        return (
          <Box display="flex" flexDirection="column" alignItems="center" py={6}>
            <RssFeed sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No posts available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This section doesn&apos;t have edufeed posts yet
            </Typography>
          </Box>
        );
      }

      return (
        <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, px: 2 }}>
            Edufeed - {selectedSection.title}
          </Typography>

        <Box display="flex" flexDirection="column">
          {sectionPosts.map((post) => (
            <Paper
              key={post.id}
              sx={{
                mb: 1,
                border: '1px solid #e1e8ed',
                borderRadius: 0,
                '&:hover': {
                  backgroundColor: '#f7f9fa'
                }
              }}
              elevation={0}
            >
              <Box sx={{ p: 2 }}>
                {/* Post Header */}
                <Box display="flex" gap={2} mb={2}>
                  <Avatar
                    sx={{ width: 40, height: 40, bgcolor: post.color }}
                  >
                    {post.emoji}
                  </Avatar>
                  <Box flex={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {post.personality_name}
                      </Typography>
                      <VerifiedUser sx={{ fontSize: 16, color: '#1da1f2' }} />
                      <Typography variant="body2" color="text.secondary">
                        @{post.personality}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ·
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(post.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton size="small">
                    <MoreVert fontSize="small" />
                  </IconButton>
                </Box>

                {/* Post Content */}
                <Typography
                  variant="body1"
                  sx={{
                    mb: 2,
                    lineHeight: 1.4,
                    whiteSpace: 'pre-line',
                    wordBreak: 'break-word'
                  }}
                >
                  {post.content}
                </Typography>

                {/* Engagement Actions */}
                <Box display="flex" justifyContent="space-between" maxWidth={425}>
                  <Button
                    size="small"
                    startIcon={<ChatBubbleOutline />}
                    onClick={() => toggleComments(post.id)}
                    sx={{
                      color: 'text.secondary',
                      '&:hover': { color: '#1da1f2', backgroundColor: '#1da1f210' }
                    }}
                  >
                    {post.replies_count}
                  </Button>

                  <Button
                    size="small"
                    startIcon={<Repeat />}
                    onClick={() => handleRetweetPost(post.id)}
                    sx={{
                      color: retweetedPosts[post.id] ? '#17bf63' : 'text.secondary',
                      '&:hover': { color: '#17bf63', backgroundColor: '#17bf6310' }
                    }}
                  >
                    {retweetedPosts[post.id] ? 1 : 0}
                  </Button>

                  <Button
                    size="small"
                    startIcon={post.user_interaction === 'like' ? <Favorite /> : <FavoriteBorder />}
                    onClick={() => handlePostInteraction(post.id, 'like')}
                    sx={{
                      color: post.user_interaction === 'like' ? '#e0245e' : 'text.secondary',
                      '&:hover': { color: '#e0245e', backgroundColor: '#e0245e10' }
                    }}
                  >
                    {post.likes_count}
                  </Button>

                  <Button
                    size="small"
                    startIcon={<Share />}
                    sx={{
                      color: 'text.secondary',
                      '&:hover': { color: '#1da1f2', backgroundColor: '#1da1f210' }
                    }}
                  >
                  </Button>
                </Box>

                {/* Comments Section */}
                {expandedComments[post.id] && (
                  <Box mt={2}>
                    {/* Add Comment Box */}
                    <Box
                      display="flex"
                      gap={2}
                      mb={2}
                      sx={{
                        p: 2,
                        backgroundColor: '#f7f9fa',
                        borderRadius: 2
                      }}
                    >
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {user.user_metadata.name?.charAt(0) || 'U'}
                      </Avatar>
                      <TextField
                        fullWidth
                        placeholder="Post your reply"
                        multiline
                        maxRows={3}
                        value={postComments[post.id] || ''}
                        onChange={(e) => handleCommentChange(post.id, e.target.value)}
                        variant="outlined"
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'white'
                          }
                        }}
                      />
                      <Button
                        variant="contained"
                        size="small"
                        disabled={!postComments[post.id]?.trim()}
                        onClick={() => handlePostInteraction(post.id, 'comment', postComments[post.id])}
                        sx={{
                          borderRadius: 20,
                          px: 3,
                          textTransform: 'none',
                          minWidth: 'auto'
                        }}
                      >
                        Reply
                      </Button>
                    </Box>

                    {/* Existing Comments */}
                    {post.replies.map((reply) => (
                      <Box key={reply.id} display="flex" gap={2} mb={2} ml={2}>
                        <Avatar
                          sx={{ width: 32, height: 32, bgcolor: '#4facfe' }}
                        >
                          {reply.emoji}
                        </Avatar>
                        <Box flex={1}>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {reply.personality_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              @{reply.personality}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {reply.content}
                          </Typography>
                          <Box display="flex" gap={3}>
                            <Button
                              size="small"
                              startIcon={<Reply />}
                              sx={{
                                color: 'text.secondary',
                                minWidth: 'auto',
                                px: 1,
                                fontSize: '0.75rem',
                                '&:hover': { color: '#1da1f2' }
                              }}
                            >
                            </Button>
                            <Button
                              size="small"
                              startIcon={reply.user_interaction === 'like' ? <Favorite /> : <FavoriteBorder />}
                              sx={{
                                color: reply.user_interaction === 'like' ? '#e0245e' : 'text.secondary',
                                minWidth: 'auto',
                                px: 1,
                                fontSize: '0.75rem',
                                '&:hover': { color: '#e0245e' }
                              }}
                            >
                              {reply.likes_count}
                            </Button>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Paper>
          ))}
        </Box>
        </Box>
      );
    };

    const renderSectionTabContent = () => {
      if (!selectedSection) return null;

      switch (noteDetailTab) {
        case 'notes':
          return renderSectionNotesTab();
        case 'quiz':
          return renderQuizTab();
        case 'flashcards':
          return renderFlashcardsTab();
        case 'edufeed':
          return renderEdufeedTab();
        default:
          return renderSectionNotesTab();
      }
    };

    const renderSectionNotesTab = () => {
      console.log('🔍 renderSectionNotesTab called. selectedSection:', selectedSection);

      if (!selectedSection) {
        console.log('❌ No selectedSection, showing helper message');
        return (
          <Box display="flex" flexDirection="column" alignItems="center" py={6}>
            <StickyNote2 sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              Select a Section First
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 400 }}>
              To view or create notes, please select a document section from the sidebar on the left.
            </Typography>
          </Box>
        );
      }

      if (contentLoading) {
        return (
          <Box display="flex" flexDirection="column" alignItems="center" py={6}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Loading notes...
            </Typography>
          </Box>
        );
      }

      return (
        <Box sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Notes ({sectionNotes.length})
            </Typography>
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  console.log('🖱️ Add Note button clicked');
                  handleCreateNote();
                }}
              >
                Add Note
              </Button>
            </Box>
          </Box>


          {/* Create Note Dialog */}
          {isClient && (
            <Dialog
              open={showCreateNoteDialog}
              onClose={() => setShowCreateNoteDialog(false)}
              maxWidth="md"
              fullWidth
            >
              <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                  <StickyNote2 sx={{ color: '#43e97b' }} />
                  Create New Note
                  {selectedSection && (
                    <Chip
                      label={selectedSection.title}
                      size="small"
                      sx={{ ml: 'auto', backgroundColor: '#4facfe20', color: '#4facfe' }}
                    />
                  )}
                </Box>
              </DialogTitle>
              <DialogContent>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Note Title"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Enter a descriptive title for your note"
                  sx={{ mb: 2 }}
                  error={noteTitle.length > 0 && noteTitle.trim().length === 0}
                  helperText={noteTitle.length > 0 && noteTitle.trim().length === 0 ? "Title cannot be empty" : ""}
                />
                <TextField
                  margin="dense"
                  label="Note Content (Markdown Supported)"
                  multiline
                  rows={8}
                  fullWidth
                  variant="outlined"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Write your note content here... You can use markdown formatting"
                  error={noteContent.length > 0 && noteContent.trim().length === 0}
                  helperText={
                    noteContent.length > 0 && noteContent.trim().length === 0
                      ? "Content cannot be empty"
                      : "Supports markdown formatting for rich text display"
                  }
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowCreateNoteDialog(false)}>Cancel</Button>
                <Button
                  onClick={submitCreateNote}
                  variant="contained"
                  disabled={!noteTitle.trim() || !noteContent.trim() || loading}
                  startIcon={loading ? <CircularProgress size={16} /> : <Save />}
                >
                  {loading ? 'Creating...' : 'Create Note'}
                </Button>
              </DialogActions>
            </Dialog>
          )}


          {sectionNotes.length > 0 ? (
            <Box display="flex" flexDirection="column" gap={3}>
              {sectionNotes.map((note) => (
                <Card
                  key={note.id}
                  sx={{
                    borderLeft: `4px solid ${note.is_generated ? '#4facfe' : '#43e97b'}`,
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                      <Box flex={1}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1.5 }}>
                          {note.title}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Chip
                            label={note.is_generated ? 'AI Generated' : 'Manual'}
                            size="small"
                            color={note.is_generated ? 'primary' : 'success'}
                            variant="filled"
                            sx={{ fontWeight: 500 }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                            {new Date(note.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </Typography>
                        </Box>
                      </Box>

                      <Box display="flex" gap={1}>
                        {!note.is_generated && (
                          <>
                            <IconButton
                              size="small"
                              onClick={() => handleEditNote(note)}
                              sx={{
                                '&:hover': {
                                  backgroundColor: 'primary.50',
                                  color: 'primary.main'
                                }
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteNote(note)}
                              sx={{
                                '&:hover': {
                                  backgroundColor: 'error.50'
                                }
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </>
                        )}
                        <IconButton
                          size="small"
                          sx={{
                            '&:hover': {
                              backgroundColor: 'action.hover'
                            }
                          }}
                        >
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Markdown formatted content with proper spacing */}
                    <Box
                      sx={{
                        '& > *:first-of-type': { mt: 0 },
                        '& > *:last-child': { mb: 0 },
                        '& h1, & h2, & h3, & h4, & h5, & h6': {
                          color: 'text.primary',
                          fontWeight: 'bold'
                        },
                        '& p': {
                          color: 'text.primary',
                          lineHeight: 1.7
                        },
                        '& ul, & ol': {
                          color: 'text.primary'
                        },
                        '& li': {
                          lineHeight: 1.6
                        },
                        '& code': {
                          fontSize: '0.875rem',
                          fontFamily: 'Consolas, Monaco, "Courier New", monospace'
                        },
                        '& pre': {
                          fontSize: '0.875rem',
                          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                          overflow: 'auto'
                        },
                        '& blockquote': {
                          borderLeft: '4px solid #e0e0e0',
                          paddingLeft: '16px',
                          fontStyle: 'italic',
                          color: 'text.secondary'
                        }
                      }}
                    >
                      {renderMarkdownContent(note.content)}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" alignItems="center" py={6}>
              <StickyNote2 sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No notes yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center', maxWidth: 400 }}>
                This section doesn&apos;t have any notes yet. You can create manual notes or wait for AI-generated notes to appear once document processing is complete.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  console.log('🖱️ Create Your First Note button clicked');
                  handleCreateNote();
                }}
                sx={{
                  borderRadius: 2,
                  transition: 'transform 0.1s ease',
                  '&:active': {
                    transform: 'scale(0.95)'
                  }
                }}
              >
                Create Your First Note
              </Button>
            </Box>
          )}

          {/* Section Statistics */}
          <Paper sx={{ p: 2, mt: 3, backgroundColor: '#f8f9fa' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
              Section Statistics
            </Typography>
            <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={2}>
              {selectedSection.content_length && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Content Length</Typography>
                  <Typography variant="body2">{selectedSection.content_length} characters</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">Total Notes</Typography>
                <Typography variant="body2">{sectionNotes.length}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">AI Generated</Typography>
                <Typography variant="body2">{sectionNotes.filter(n => n.is_generated).length}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Manual Notes</Typography>
                <Typography variant="body2">{sectionNotes.filter(n => !n.is_generated).length}</Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      );
    };

    return (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header with back button */}
        <Box display="flex" alignItems="center" gap={2} sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <IconButton
            onClick={() => setSelectedNote(null)}
            sx={{
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark',
              }
            }}
          >
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {selectedNote.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedNote.folder_name || 'No folder'} • {selectedNote.total_pages ? `${selectedNote.total_pages} pages` : 'Processing...'}
            </Typography>
          </Box>
        </Box>

        {/* Main Content Area */}
        <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left Sidebar - Document Sections */}
          <Paper
            sx={{
              width: { xs: '100%', md: 320 },
              borderRadius: 0,
              borderRight: { xs: 0, md: 1 },
              borderColor: 'divider',
              display: { xs: selectedSection ? 'none' : 'flex', md: 'flex' },
              flexDirection: 'column'
            }}
          >
            {/* Document Info Header */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                Document Sections
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {getProcessingStatusChip(selectedNote.processing_status, selectedNote.id)}
                {selectedNote.section_count && (
                  <Chip
                    label={`${selectedNote.section_count} sections`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>

            {/* Sections List */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
              {sectionsLoading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : documentSections.length > 0 ? (
                <Box display="flex" flexDirection="column" gap={1}>
                  {documentSections.map((section) => (
                    <Card
                      key={section.id}
                      sx={{
                        cursor: 'pointer',
                        border: selectedSection?.id === section.id ? `2px solid #4facfe` : '1px solid #e0e0e0',
                        backgroundColor: selectedSection?.id === section.id ? '#4facfe10' : 'transparent',
                        '&:hover': {
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }
                      }}
                      onClick={() => {
                        setSelectedSection(section);
                        // Load section text content if not already loaded
                        if (!section.content) {
                          loadSectionContent(selectedNote.id, section.id);
                        }
                        // Load all section content (quiz, flashcards, edufeed)
                        loadAllSectionContent(section.id);
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Chip
                            label={`${section.section_order + 1}`}
                            size="small"
                            sx={{
                              backgroundColor: selectedSection?.id === section.id ? '#4facfe' : '#f5f5f5',
                              color: selectedSection?.id === section.id ? 'white' : 'text.primary',
                              fontWeight: 'bold',
                              minWidth: 28
                            }}
                          />
                          {getProcessingStatusChip(section.processing_status, section.id)}
                        </Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'medium', mb: 1, lineHeight: 1.3 }}>
                          {section.title}
                        </Typography>
                        <Box display="flex" gap={1} flexWrap="wrap">
                          {section.notes_count !== undefined && (
                            <Typography variant="caption" color="text.secondary">
                              {section.notes_count} notes
                            </Typography>
                          )}
                          {section.quiz_count !== undefined && (
                            <Typography variant="caption" color="text.secondary">
                              {section.quiz_count} quiz
                            </Typography>
                          )}
                          {section.flashcards_count !== undefined && (
                            <Typography variant="caption" color="text.secondary">
                              {section.flashcards_count} cards
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    No sections available
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedNote.processing_status === 'completed'
                      ? 'This document has no processed sections'
                      : 'Document is still processing'}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Right Panel - Section Content with Tabs */}
          <Box sx={{
            flex: 1,
            display: { xs: selectedSection ? 'flex' : 'none', md: 'flex' },
            flexDirection: 'column'
          }}>
            {selectedSection ? (
              <>
                {/* Section Header */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <IconButton
                      sx={{ display: { xs: 'inline-flex', md: 'none' } }}
                      onClick={() => setSelectedSection(null)}
                    >
                      <ArrowBack />
                    </IconButton>
                    <Box flex={1}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {selectedSection.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Section {selectedSection.section_order + 1}
                        {selectedSection.content_length && ` • ${selectedSection.content_length} characters`}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Tabs for section content */}
                <Paper sx={{ borderRadius: 0 }}>
                  <Tabs
                    value={noteDetailTab}
                    onChange={(e, newValue) => setNoteDetailTab(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                      borderBottom: 1,
                      borderColor: 'divider',
                      '& .MuiTab-root': {
                        textTransform: 'none',
                        fontWeight: 'medium',
                        fontSize: '1rem',
                      }
                    }}
                  >
                    {sectionDetailTabs.map((tab) => (
                      <Tab
                        key={tab.value}
                        label={tab.label}
                        value={tab.value}
                        icon={tab.icon}
                        iconPosition="start"
                      />
                    ))}
                  </Tabs>
                </Paper>

                {/* Tab content */}
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  {renderSectionTabContent()}
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 4,
                  textAlign: 'center'
                }}
              >
                <StickyNote2 sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  Select a section
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose a section from the left to view its notes, quizzes, and flashcards
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'billing':
        return (
          <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            <SubscriptionManagement
              className=""
              products={products}
              currentPlan={userSubscription.subscription}
              updatePlan={{
                currentPlan: userSubscription.subscription,
                onPlanChange: handlePlanChange,
                triggerText: userSubscription.user.currentSubscriptionId
                  ? "Change Plan"
                  : "Upgrade Plan",
                products: products,
              }}
              cancelSubscription={{
                products: products,
                title: "Cancel Subscription",
                description: "Are you sure you want to cancel your subscription?",
                leftPanelImageUrl: "https://img.freepik.com/free-vector/abstract-paper-cut-shape-wave-background_474888-4649.jpg?semt=ais_hybrid&w=740&q=80",
                plan: userSubscription.subscription,
                warningTitle: "You will lose access to your account",
                warningText: "If you cancel your subscription, you will lose access to your account and all your data will be deleted.",
                onCancel: async (planId) => {
                  if (userSubscription.subscription) {
                    await cancelSubscription({
                      subscriptionId: userSubscription.subscription.subscriptionId,
                    });
                  }
                  toast.success("Subscription cancelled successfully");
                  window.location.reload();
                  return;
                },
                onKeepSubscription: async (planId) => {
                  console.log("keep subscription", planId);
                },
              }}
            />
          </Container>
        );
      case 'invoices':
        return (
          <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            <InvoiceHistory invoices={invoices} />
          </Container>
        );
      case 'notes':
        return selectedNote ? renderNoteDetail() : renderNotes();
      case 'account':
        return (
          <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            <AccountManagement
              className=""
              user={user}
              userSubscription={userSubscription}
            />
          </Container>
        );
      default:
        return renderOverview();
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'white',
          color: 'text.primary',
          boxShadow: '0px 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.id === activeTab)?.text || 'Dashboard'}
          </Typography>
          <IconButton color="inherit">
            <Notifications />
          </IconButton>
          <Avatar
            sx={{ ml: 2 }}
            src={user.user_metadata.avatar_url || user.user_metadata.picture}
          >
            {user.user_metadata.name?.charAt(0)}
          </Avatar>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid #e0e0e0',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: '#f5f5f5',
        }}
      >
        <Toolbar />
        {renderContent()}
      </Box>
    </Box>
  );
}
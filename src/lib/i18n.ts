export type Language = 'az' | 'en';

export const translations = {
  az: {
    // Sidebar
    dashboard: 'Əsas Səhifə',
    orders: 'Müştəri Sifarişləri',
    inventory: 'Anbar',
    expenses: 'Xərclər',
    analytics: 'Analitika',

    // Common
    save: 'Saxla',
    cancel: 'Ləğv et',
    delete: 'Sil',
    edit: 'Redaktə et',
    view: 'Bax',
    create: 'Yarat',
    search: 'Axtar',
    filter: 'Filtr',
    actions: 'Əməliyyatlar',
    loading: 'Yüklənir...',
    noData: 'Məlumat yoxdur',
    confirm: 'Təsdiq et',
    yes: 'Bəli',
    no: 'Xeyr',
    close: 'Bağla',
    total: 'Cəmi',
    date: 'Tarix',
    amount: 'Məbləğ',
    category: 'Kateqoriya',
    notes: 'Qeydlər',
    name: 'Ad',
    phone: 'Telefon',
    address: 'Ünvan',
    status: 'Status',
    price: 'Qiymət',
    quantity: 'Miqdar',
    description: 'Təsvir',

    // Dashboard
    dailySales: 'Gündəlik Satışlar',
    monthlySales: 'Aylıq Satışlar',
    dailyProfit: 'Gündəlik Mənfəət',
    monthlyProfit: 'Aylıq Mənfəət',
    salesSources: 'Satış Mənbələri',
    expenseDistribution: 'Xərc Bölgüsü',
    orderStatus: 'Sifariş Statusu',
    totalRevenue: 'Ümumi Gəlir',
    totalExpenses: 'Ümumi Xərclər',
    totalOrders: 'Ümumi Sifarişlər',
    totalProducts: 'Ümumi Məhsullar',

    // Orders
    createNewOrder: 'Yeni Sifariş Yarat',
    customerName: 'Müştəri Adı',
    customerPhone: 'Müştəri Telefonu',
    customerAddress: 'Müştəri Ünvanı',
    productName: 'Məhsul Adı',
    productType: 'Məhsul Növü',
    productImage: 'Məhsul Şəkli',
    orderDate: 'Sifariş Tarixi',
    totalPrice: 'Ümumi Qiymət',
    paymentMethod: 'Ödəniş Üsulu',
    paymentStatus: 'Ödəniş Statusu',
    orderStatusLabel: 'Sifariş Statusu',
    additionalNotes: 'Əlavə Qeydlər',
    customerInfo: 'Müştəri Məlumatları',
    productInfo: 'Məhsul Məlumatları',

    // Order statuses
    notStarted: 'Başlanmayıb',
    started: 'Başlanıb',
    finished: 'Bitib',
    paid: 'Ödənilib',

    // Payment methods
    cash: 'Nağd',
    card: 'Kart',
    bankTransfer: 'Bank Köçürməsi',

    // Payment statuses
    unpaid: 'Ödənilməyib',
    partiallyPaid: 'Qismən Ödənilib',
    paidStatus: 'Ödənilib',

    // Inventory
    addProduct: 'Məhsul Əlavə Et',
    editProduct: 'Məhsulu Redaktə Et',
    stockQuantity: 'Anbardakı Miqdar',
    purchasePrice: 'Alış Qiyməti',
    sellingPrice: 'Satış Qiyməti',
    lastUpdated: 'Son Yenilənmə',
    addNewProduct: 'Yeni Məhsul Əlavə Et',
    recordIncomingStock: 'Gələn Mal Qeydiyyatı',
    recordSoldProduct: 'Satılmış Mal Qeydiyyatı',
    increaseStock: 'Stoku Artır',
    decreaseStock: 'Stoku Azalt',

    // Expenses
    addExpense: 'Xərc Əlavə Et',
    expenseCategory: 'Xərc Kateqoriyası',
    enteredBy: 'Qeyd Edən',
    expenseHistory: 'Xərc Tarixçəsi',
    currentBalance: 'Cari Balans',
    cashBalance: 'Nağd Balans',
    advertising: 'Reklam',
    salary: 'Maaş',
    logistics: 'Logistika',
    officeSupplies: 'Ofis Ləvazimatları',
    other: 'Digər',

    // Analytics
    revenueOverTime: 'Zamana Görə Gəlir',
    profitTrends: 'Mənfəət Tendensiyaları',
    productSalesDistribution: 'Məhsul Satış Bölgüsü',
    customerAcquisition: 'Müştəri Əldə Etmə Mənbələri',
    expenseBreakdown: 'Xərc Təhlili',

    // Sources
    instagram: 'Instagram',
    facebook: 'Facebook',
    referral: 'Tövsiyə',

    // Theme
    lightMode: 'İşıqlı Rejim',
    darkMode: 'Qaranlıq Rejim',

    // Misc
    deleteConfirm: 'Silmək istədiyinizdən əminsiniz?',
    orderCreated: 'Sifariş yaradıldı',
    orderUpdated: 'Sifariş yeniləndi',
    orderDeleted: 'Sifariş silindi',
    productCreated: 'Məhsul əlavə edildi',
    productUpdated: 'Məhsul yeniləndi',
    productDeleted: 'Məhsul silindi',
    expenseCreated: 'Xərc əlavə edildi',
    completed: 'Tamamlanıb',
    inProgress: 'Davam edir',
    pending: 'Gözləyir',

    // Auth
    signIn: 'Daxil ol',
    signUp: 'Qeydiyyat',
    email: 'E-poçt',
    password: 'Şifrə',
    confirmPassword: 'Şifrəni təsdiqlə',
    fullName: 'Tam ad',
    noAccount: 'Hesabınız yoxdur?',
    haveAccount: 'Artıq hesabınız var?',
    signOutLabel: 'Çıxış',
    signingIn: 'Daxil olunur...',
    signingUp: 'Qeydiyyat olunur...',
    authError: 'Xəta baş verdi',
    invalidCredentials: 'Yanlış e-poçt və ya şifrə',
    passwordMismatch: 'Şifrələr uyğun gəlmir',
    signUpSuccess: 'Qeydiyyat uğurlu oldu! E-poçtunuzu yoxlayın.',
    welcomeBack: 'Xoş gəlmisiniz!',
    profile: 'Profil',
    role: 'Rol',

    // Roles
    roleAdmin: 'Admin',
    roleModerator: 'Moderator',
    roleUser: 'İstifadəçi',

    // User Management
    userManagement: 'İstifadəçi İdarəetməsi',
    searchUsers: 'İstifadəçi axtar...',
    changeRole: 'Rolu dəyişdir',
    roleUpdated: 'Rol yeniləndi',
    users: 'İstifadəçilər',

    // Access
    accessDenied: 'Giriş qadağandır',
    noPermission: 'Bu səhifəyə giriş hüququnuz yoxdur',

    // Confirm Modal
    deleteWarning: 'Bu əməliyyat geri qaytarıla bilməz.',
    areYouSure: 'Əminsiniz?',
  },
  en: {
    // Sidebar
    dashboard: 'Dashboard',
    orders: 'Customer Orders',
    inventory: 'Inventory',
    expenses: 'Expenses',
    analytics: 'Analytics',

    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    create: 'Create',
    search: 'Search',
    filter: 'Filter',
    actions: 'Actions',
    loading: 'Loading...',
    noData: 'No data available',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    close: 'Close',
    total: 'Total',
    date: 'Date',
    amount: 'Amount',
    category: 'Category',
    notes: 'Notes',
    name: 'Name',
    phone: 'Phone',
    address: 'Address',
    status: 'Status',
    price: 'Price',
    quantity: 'Quantity',
    description: 'Description',

    // Dashboard
    dailySales: 'Daily Sales',
    monthlySales: 'Monthly Sales',
    dailyProfit: 'Daily Profit',
    monthlyProfit: 'Monthly Profit',
    salesSources: 'Sales Sources',
    expenseDistribution: 'Expense Distribution',
    orderStatus: 'Order Status',
    totalRevenue: 'Total Revenue',
    totalExpenses: 'Total Expenses',
    totalOrders: 'Total Orders',
    totalProducts: 'Total Products',

    // Orders
    createNewOrder: 'Create New Order',
    customerName: 'Customer Name',
    customerPhone: 'Customer Phone',
    customerAddress: 'Customer Address',
    productName: 'Product Name',
    productType: 'Product Type',
    productImage: 'Product Image',
    orderDate: 'Order Date',
    totalPrice: 'Total Price',
    paymentMethod: 'Payment Method',
    paymentStatus: 'Payment Status',
    orderStatusLabel: 'Order Status',
    additionalNotes: 'Additional Notes',
    customerInfo: 'Customer Information',
    productInfo: 'Product Information',

    // Order statuses
    notStarted: 'Not Started',
    started: 'Started',
    finished: 'Finished',
    paid: 'Paid',

    // Payment methods
    cash: 'Cash',
    card: 'Card',
    bankTransfer: 'Bank Transfer',

    // Payment statuses
    unpaid: 'Unpaid',
    partiallyPaid: 'Partially Paid',
    paidStatus: 'Paid',

    // Inventory
    addProduct: 'Add Product',
    editProduct: 'Edit Product',
    stockQuantity: 'Stock Quantity',
    purchasePrice: 'Purchase Price',
    sellingPrice: 'Selling Price',
    lastUpdated: 'Last Updated',
    addNewProduct: 'Add New Product',
    recordIncomingStock: 'Record Incoming Stock',
    recordSoldProduct: 'Record Sold Product',
    increaseStock: 'Increase Stock',
    decreaseStock: 'Decrease Stock',

    // Expenses
    addExpense: 'Add Expense',
    expenseCategory: 'Expense Category',
    enteredBy: 'Entered By',
    expenseHistory: 'Expense History',
    currentBalance: 'Current Balance',
    cashBalance: 'Cash Balance',
    advertising: 'Advertising',
    salary: 'Salary',
    logistics: 'Logistics',
    officeSupplies: 'Office Supplies',
    other: 'Other',

    // Analytics
    revenueOverTime: 'Revenue Over Time',
    profitTrends: 'Profit Trends',
    productSalesDistribution: 'Product Sales Distribution',
    customerAcquisition: 'Customer Acquisition Sources',
    expenseBreakdown: 'Expense Breakdown',

    // Sources
    instagram: 'Instagram',
    facebook: 'Facebook',
    referral: 'Referral',

    // Theme
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',

    // Misc
    deleteConfirm: 'Are you sure you want to delete?',
    orderCreated: 'Order created',
    orderUpdated: 'Order updated',
    orderDeleted: 'Order deleted',
    productCreated: 'Product added',
    productUpdated: 'Product updated',
    productDeleted: 'Product deleted',
    expenseCreated: 'Expense added',
    completed: 'Completed',
    inProgress: 'In Progress',
    pending: 'Pending',

    // Auth
    signIn: 'Sign In',
    signUp: 'Sign Up',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    fullName: 'Full Name',
    noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    signOutLabel: 'Sign Out',
    signingIn: 'Signing in...',
    signingUp: 'Signing up...',
    authError: 'An error occurred',
    invalidCredentials: 'Invalid email or password',
    passwordMismatch: 'Passwords do not match',
    signUpSuccess: 'Sign up successful! Check your email.',
    welcomeBack: 'Welcome back!',
    profile: 'Profile',
    role: 'Role',

    // Roles
    roleAdmin: 'Admin',
    roleModerator: 'Moderator',
    roleUser: 'User',

    // User Management
    userManagement: 'User Management',
    searchUsers: 'Search users...',
    changeRole: 'Change Role',
    roleUpdated: 'Role updated',
    users: 'Users',

    // Access
    accessDenied: 'Access Denied',
    noPermission: 'You do not have permission to access this page',

    // Confirm Modal
    deleteWarning: 'This action cannot be undone.',
    areYouSure: 'Are you sure?',
  },
} as const;

export type TranslationKey = keyof typeof translations.az;

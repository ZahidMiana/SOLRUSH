/**
 * Transaction Error Types
 * Classifies common Solana transaction errors for better user feedback
 */
export enum TransactionErrorType {
    INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
    SLIPPAGE_EXCEEDED = 'SLIPPAGE_EXCEEDED',
    POOL_NOT_FOUND = 'POOL_NOT_FOUND',
    INVALID_AMOUNT = 'INVALID_AMOUNT',
    WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
    NETWORK_ERROR = 'NETWORK_ERROR',
    PROGRAM_ERROR = 'PROGRAM_ERROR',
    TIMEOUT = 'TIMEOUT',
    UNKNOWN = 'UNKNOWN',
}

export interface ParsedError {
    type: TransactionErrorType;
    title: string;
    message: string;
    suggestion: string;
}

/**
 * Parse Solana transaction errors into user-friendly messages
 */
export function parseTransactionError(error: any): ParsedError {
    const errorMessage = error?.message || error?.toString() || '';
    const errorCode = error?.code;

    // Insufficient funds
    if (
        errorMessage.includes('insufficient funds') ||
        errorMessage.includes('Insufficient lamports') ||
        errorCode === 1
    ) {
        return {
            type: TransactionErrorType.INSUFFICIENT_FUNDS,
            title: 'Insufficient Balance',
            message: 'You don\'t have enough funds to complete this transaction.',
            suggestion: 'Add more SOL to your wallet or reduce the transaction amount.',
        };
    }

    // Slippage exceeded
    if (
        errorMessage.includes('slippage') ||
        errorMessage.includes('SlippageExceeded') ||
        errorMessage.includes('price impact too high')
    ) {
        return {
            type: TransactionErrorType.SLIPPAGE_EXCEEDED,
            title: 'Slippage Tolerance Exceeded',
            message: 'The price moved too much during the transaction.',
            suggestion: 'Increase your slippage tolerance or try again with a smaller amount.',
        };
    }

    // Pool not found
    if (
        errorMessage.includes('pool not found') ||
        errorMessage.includes('Account does not exist') ||
        errorMessage.includes('PoolNotFound')
    ) {
        return {
            type: TransactionErrorType.POOL_NOT_FOUND,
            title: 'Pool Not Found',
            message: 'The liquidity pool for this token pair doesn\'t exist.',
            suggestion: 'Try a different token pair or create a new pool.',
        };
    }

    // Invalid amount
    if (
        errorMessage.includes('invalid amount') ||
        errorMessage.includes('Amount must be greater than') ||
        errorMessage.includes('InvalidAmount')
    ) {
        return {
            type: TransactionErrorType.INVALID_AMOUNT,
            title: 'Invalid Amount',
            message: 'The amount you entered is invalid.',
            suggestion: 'Enter a valid positive number greater than zero.',
        };
    }

    // Wallet not connected
    if (
        errorMessage.includes('wallet') ||
        errorMessage.includes('not connected') ||
        errorMessage.includes('WalletNotConnectedError')
    ) {
        return {
            type: TransactionErrorType.WALLET_NOT_CONNECTED,
            title: 'Wallet Not Connected',
            message: 'Please connect your wallet to continue.',
            suggestion: 'Click the "Connect Wallet" button in the top right.',
        };
    }

    // Network error
    if (
        errorMessage.includes('network') ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('ECONNREFUSED')
    ) {
        return {
            type: TransactionErrorType.NETWORK_ERROR,
            title: 'Network Error',
            message: 'Unable to connect to the Solana network.',
            suggestion: 'Check your internet connection and try again.',
        };
    }

    // Program error
    if (
        errorMessage.includes('Program') ||
        errorMessage.includes('custom program error') ||
        errorCode >= 6000
    ) {
        return {
            type: TransactionErrorType.PROGRAM_ERROR,
            title: 'Transaction Failed',
            message: 'The smart contract rejected this transaction.',
            suggestion: 'Please check your inputs and try again.',
        };
    }

    // Timeout
    if (
        errorMessage.includes('timeout') ||
        errorMessage.includes('timed out')
    ) {
        return {
            type: TransactionErrorType.TIMEOUT,
            title: 'Transaction Timeout',
            message: 'The transaction took too long to process.',
            suggestion: 'The network may be congested. Please try again.',
        };
    }

    // Unknown error
    return {
        type: TransactionErrorType.UNKNOWN,
        title: 'Transaction Failed',
        message: errorMessage || 'An unknown error occurred.',
        suggestion: 'Please try again or contact support if the problem persists.',
    };
}

/**
 * Log error for debugging
 */
export function logTransactionError(error: any, context: string) {
    const parsed = parseTransactionError(error);
    console.error(`[${context}] ${parsed.type}:`, {
        title: parsed.title,
        message: parsed.message,
        originalError: error,
    });
}

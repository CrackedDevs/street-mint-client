export class SolanaFMService {
    private static readonly BASE_URL = 'https://solana.fm';
    private static readonly CLUSTER = process.env.NEXT_PUBLIC_NODE_ENV === 'development' ? 'devnet-alpha' : 'mainnet-beta';

    private static getUrl(type: 'tx' | 'address' | 'token', id: string): string {
        return `${this.BASE_URL}/${type}/${id}?cluster=${this.CLUSTER}`;
    }

    static getTransaction(transactionSignature: string): string {
        return this.getUrl('tx', transactionSignature);
    }

    static getAddress(address: string): string {
        return this.getUrl('address', address);
    }

    static getToken(tokenAddress: string): string {
        return this.getUrl('address', tokenAddress);
    }
}
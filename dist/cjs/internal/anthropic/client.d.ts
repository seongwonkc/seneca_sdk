/**
 * Anthropic API client. Internal only. Limbs never invoke Claude directly
 * through this SDK — they get streams from higher-level methods.
 */
export interface AnthropicCallParams {
    model: string;
    system: string;
    messages: Array<{
        role: "user" | "assistant";
        content: string;
    }>;
    maxTokens: number;
}
export declare function callAnthropic(_params: AnthropicCallParams): Promise<unknown>;
//# sourceMappingURL=client.d.ts.map
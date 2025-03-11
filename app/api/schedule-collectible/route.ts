import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdminClient';

export async function GET() {
    try {
        const supabaseAdmin = await getSupabaseAdmin();
        const currentUnixTimestamp = Math.floor(Date.now() / 1000);

        // Get all unexecuted scheduled changes where the schedule time has passed
        const { data: scheduledChanges, error: fetchError } = await supabaseAdmin
            .from('collectible_schedule')
            .select('*')
            .eq('executed', false)
            .lte('schedule_unix', currentUnixTimestamp);

        if (fetchError) {
            console.error('Error fetching scheduled changes:', fetchError);
            return NextResponse.json({ error: 'Failed to fetch scheduled changes' }, { status: 500 });
        }

        if (!scheduledChanges || scheduledChanges.length === 0) {
            return NextResponse.json({ message: 'No changes to process' }, { status: 200 });
        }

        const results = [];

        // Process each scheduled change
        for (const change of scheduledChanges) {
            try {
                // Skip if chip_id is null
                if (!change.chip_id) {
                    results.push({
                        id: change.id,
                        status: 'failed',
                        error: 'Chip ID is null'
                    });
                    continue;
                }

                // Update the chip link with the new collectible
                const { error: updateError } = await supabaseAdmin
                    .from('chip_links')
                    .update({ collectible_id: change.collectible_id })
                    .eq('chip_id', change.chip_id);

                if (updateError) {
                    console.error(`Error updating chip link for chip ${change.chip_id}:`, updateError);
                    results.push({
                        id: change.id,
                        status: 'failed',
                        error: updateError.message
                    });
                    continue;
                }

                // Mark the scheduled change as executed
                const { error: markExecutedError } = await supabaseAdmin
                    .from('collectible_schedule')
                    .update({ executed: true })
                    .eq('id', change.id);

                if (markExecutedError) {
                    console.error(`Error marking change ${change.id} as executed:`, markExecutedError);
                    results.push({
                        id: change.id,
                        status: 'partially_failed',
                        error: 'Chip link updated but failed to mark as executed'
                    });
                    continue;
                }

                results.push({
                    id: change.id,
                    status: 'success',
                    message: `Successfully updated chip ${change.chip_id} to collectible ${change.collectible_id}`
                });

            } catch (error) {
                console.error(`Error processing change ${change.id}:`, error);
                results.push({
                    id: change.id,
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        return NextResponse.json({
            message: 'Processed scheduled changes',
            results
        }, { status: 200 });

    } catch (error) {
        console.error('Error in schedule-collectible route:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 
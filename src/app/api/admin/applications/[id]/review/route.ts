import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { action, notes } = await request.json();

    if (!['approve', 'reject', 'request_info'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    if (action === 'approve') {
      const baseSlug = generateSlug(application.projectName);
      let slug = baseSlug;
      let counter = 1;
      
      while (await prisma.networkMember.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      const seeking: string[] = [];
      if (application.seekingListing) seeking.push('listing');
      if (application.seekingLPIntros) seeking.push('lp_intros');
      if (application.seekingDistribution) seeking.push('distribution');
      if (application.seekingOther) seeking.push(application.seekingOther);

      const offering: string[] = [];
      if (application.offeringLiquidity) offering.push('liquidity');
      if (application.offeringIntegration) offering.push('integration');
      if (application.offeringOther) offering.push(application.offeringOther);

      await prisma.$transaction(async (tx) => {
        await tx.application.update({
          where: { id },
          data: {
            status: 'APPROVED',
            reviewerNotes: notes || null,
            reviewedBy: session.user.id,
            reviewedAt: new Date(),
          },
        });
        
        await tx.networkMember.create({
          data: {
            userId: application.userId || undefined,
            applicationId: application.id,
            name: application.projectName,
            slug,
            logo: application.logoUrl,
            website: application.website,
            twitter: application.twitter,
            discord: application.discord,
            github: application.github,
            description: application.description,
            category: application.category,
            stage: application.stage,
            seeking,
            offering,
          },
        });

        if (application.userId) {
          await tx.user.update({
            where: { id: application.userId },
            data: { role: 'MEMBER' },
          });
        }
      });

      return NextResponse.json({ success: true, action: 'approved' });
    }

    if (action === 'reject') {
      if (!notes?.trim()) {
        return NextResponse.json(
          { error: 'Notes required for rejection' },
          { status: 400 }
        );
      }

      await prisma.application.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reviewerNotes: notes,
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, action: 'rejected' });
    }

    if (action === 'request_info') {
      if (!notes?.trim()) {
        return NextResponse.json(
          { error: 'Notes required when requesting more info' },
          { status: 400 }
        );
      }

      await prisma.application.update({
        where: { id },
        data: {
          status: 'NEEDS_INFO',
          reviewerNotes: notes,
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, action: 'needs_info' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Review action error:', error);
    return NextResponse.json(
      { error: 'Failed to process review action' },
      { status: 500 }
    );
  }
}

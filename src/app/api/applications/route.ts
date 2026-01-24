import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const existingApplication = await prisma.application.findFirst({
      where: {
        userId: session.user.id,
        status: { notIn: ['REJECTED'] },
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You already have a pending application' },
        { status: 400 }
      );
    }

    const data = await request.json();

    const application = await prisma.application.create({
      data: {
        userId: session.user.id,
        projectName: data.projectName,
        website: data.website,
        contactEmail: data.contactEmail,
        twitter: data.twitter || null,
        discord: data.discord || null,
        github: data.github || null,
        description: data.description,
        teamInfo: data.teamInfo || '',
        category: data.category,
        stage: data.stage,
        seekingListing: data.seekingListing || false,
        seekingLPIntros: data.seekingLPIntros || false,
        seekingDistribution: data.seekingDistribution || false,
        seekingOther: data.seekingOther || null,
        offeringLiquidity: data.offeringLiquidity || false,
        offeringIntegration: data.offeringIntegration || false,
        offeringOther: data.offeringOther || null,
        proofOfWork: data.proofOfWork || null,
        logoUrl: data.logoUrl || null,
        attachmentUrls: data.attachmentUrls || [],
        status: 'SUBMITTED',
      },
    });

    return NextResponse.json({
      id: application.id,
      status: application.status,
    });
  } catch (error) {
    console.error('Application submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const application = await prisma.application.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!application) {
      return NextResponse.json({ application: null });
    }

    return NextResponse.json({ application });
  } catch (error) {
    console.error('Application fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.projectName || !data.website || !data.contactEmail || !data.description || !data.category || !data.stage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const existingApplication = await prisma.application.findFirst({
      where: {
        contactEmail: data.contactEmail,
        status: { notIn: ['REJECTED'] },
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: 'An application with this email already exists' },
        { status: 400 }
      );
    }

    const application = await prisma.application.create({
      data: {
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

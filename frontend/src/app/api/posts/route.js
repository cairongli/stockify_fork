import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    console.log('Fetching posts...');
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:author (
          user_id,
          user_name,
          wallet_amt
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    console.log('Fetched posts:', posts);

    // Transform the data to match the expected format
    const transformedPosts = posts.map(post => ({
      id: post.id,
      content: post.body,
      created_at: post.created_at,
      author_id: post.author,
      author_name: post.profiles?.user_name || 'Anonymous'
    }));

    console.log('Transformed posts:', transformedPosts);
    return NextResponse.json(transformedPosts);
  } catch (error) {
    console.error('Error in posts API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content } = await request.json();
    console.log('Creating post with content:', content);

    const { data, error } = await supabase
      .from('posts')
      .insert([
        {
          body: content,
          author: session.user.id
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating post:', error);
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }

    console.log('Created post:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in posts API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
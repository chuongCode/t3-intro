import { SignIn, SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import Head from "next/head";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

import Image from 'next/image'

import { RouterOutputs, api } from "~/utils/api";
import { LoadingPage } from "~/components/loading";

const CreatePostWizard = () => {
  const {user} = useUser();

  if (!user) return null;

  return (
    <div className="flex gap-3">
      <Image 
        src={user.profileImageUrl} 
        alt="Profile Image" 
        className="w-12 h-12 rounded-full"
        width={56}
        height={56} 
      />
      <input placeholder="Tell your story through emojis!" className="grow bg-transparent outline-none"/>

    </div>
  );

}

type PostWithAuthor = RouterOutputs["post"]["getAll"][number];

const PostView = (props: PostWithAuthor) => {

  const {post, author} = props;

  return (
    <div key={post.id} className="p-4 border-b border-slate-500 flex gap-3">
      <Image
        src={author.profileImageUrl}
        className="h-12 w-12 rounded-full"
        alt={`@${author.username}'s profile picture`}
        width={56}
        height={56}
      />
      <div className="flex flex-col">
        {/* Trying to avoid doing strings inside of JSX template directly */}
        <div className="flex text-slate-300 gap-1">
          <span>{`@${author.username!}`}</span>
          {/* Day.js API for relative time */}
          <span>{` · ${dayjs(post.createdAt).fromNow()}`}</span>
        </div>
        <span>{post.content}</span>
      </div>
    </div>
  );
};

// Call same hook twice
const Feed = () => {
  const { data, isLoading: postsLoading } = api.post.getAll.useQuery();

  if (postsLoading)
    return (
      <div className="flex grow">
        <LoadingPage />
      </div>
    );

  if (!data) return <div>Something went wrong</div>;

  return (
    <div className="flex grow flex-col overflow-y-scroll">
      {[...data, ...data, ].map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

const Home: NextPage = () => {

  const { isLoaded: userLoaded, isSignedIn } = useUser();

  // Start fetching asap
  api.post.getAll.useQuery();

  // User usually loads faster, so return an empty div if both posts and user are not loaded
  if (!userLoaded) return <div />

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex justify-center h-screen">
        <div className ="w-full md:max-w-2xl bg-slate-800 border-x border-slate-500">
          <div className="flex border-b border-slate-500 p-4">
            {!isSignedIn && (
            <div className="flex justify-center">
              <SignInButton />
            </div>
            )}
            {isSignedIn && <CreatePostWizard />}
          </div>
          <Feed />
        </div>
      </main>
    </>
  );
};

export default Home;
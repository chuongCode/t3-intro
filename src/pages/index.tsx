import { SignInButton, useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import Head from "next/head";

import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from "next/image";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import { useState } from "react";
import toast from "react-hot-toast";

dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const {user} = useUser();

  const [input, setInput] = useState("");

  // useContext was deprecated
  const ctx = api.useUtils();

  // Clear input and load posts again
  const { mutate, isLoading: isPosting } = api.post.create.useMutation({
    onSuccess: () => {
      setInput("");
      void ctx.post.getAll.invalidate();
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;
      if (errorMessage && errorMessage[0]) {
        toast.error(errorMessage[0]);
      } else {
        toast.error("Something went wrong!");
      }
    }
  });

  if (!user) return null;

  return (
    <div className="flex w-full gap-3">
      <Image
        // profileImageUrl was deprecated
        src={user.imageUrl}
        alt="Profile image"
        className="h-12 w-12 rounded-full"
        width={56}
        height={56}
      />
      <input
        placeholder="Tell your story through emojis!"
        className="grow bg-transparent outline-none"
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}

        // Press enter to post
        onKeyDown={(e) => { 
          if (e.key === "Enter" && input != "") {
            e.preventDefault();
            if (input !== "") {
              mutate({ content: input });
            }
          }
        }}
        disabled={isPosting}
      />
      {/* Hide the button when not isPosting and hide button when posting to prevent double */}
      {input != "" && !isPosting && (
        <button onClick={() => mutate({ content: input })}>Post</button>
      )}

      {/* Loading spinner when posting */}
      {isPosting && (
        <div className="flex items-center justify-center">
          <LoadingSpinner size={20}/>
        </div>
      )}
    </div>
  );
};

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
          <span>{`@${author.username}`}</span>
          {/* Day.js API for relative time */}
          <span className="font-thin">{` · ${dayjs(
            post.createdAt
          ).fromNow()}`}</span>
        </div>
        <span className="text-2xl">{post.content}</span>
      </div>
    </div>
  );
};

// Call same hook twice
const Feed = () => {
  const { data, isLoading: postsLoading } = api.post.getAll.useQuery();

  if (postsLoading) return <LoadingPage />;

  if (!data) return <div>Something went wrong</div>;

  return (
    <div className="flex grow flex-col overflow-y-scroll">
      {data?.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

const Home: NextPage = () => {

  const { isLoaded: userLoaded, isSignedIn } = useUser();

  // Start fetching
  api.post.getAll.useQuery();

  // User usually loads faster, so return an empty div if both posts and user are not loaded
  if (!userLoaded) return <div />;

  return (
    <>
      <Head>
        <title>Emojiland</title>
        <meta name="description" content="Express your thoughts through emoji posts every hour!" />
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
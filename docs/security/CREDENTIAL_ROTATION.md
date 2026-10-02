# Credential rotation record

The repository previously contained a Google Maps API key in a documentation
demo component. The source was replaced with `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
runtime configuration, and no Google API key remains in the working tree.

Because provider credentials cannot be revoked from the repository, an owner of
the Google Cloud project must rotate the historical key:

1. Open Google Cloud Console → APIs & Services → Credentials.
2. Identify the key associated with the historical demo commit.
3. Restrict the replacement key to the required Maps APIs and approved origins.
4. Update the deployment secret `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` through the
   deployment secret manager.
5. Revoke or delete the historical key and review its usage metrics.

Do not place the replacement key in source control. The historical key appeared
in commit `d215e64` and should be treated as exposed until revoked.

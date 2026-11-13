library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity top_module is
    generic (
        LANES : positive := 4
    );
    port (
        request : in std_logic_vector(LANES-1 downto 0);
        inhibit : in std_logic_vector(LANES-1 downto 0);
        grant : out std_logic_vector(LANES-1 downto 0);
        any_grant : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    lane_gen: for i in grant'range generate grant(i) <= request(i) and not inhibit(i); end generate; any_grant <= or grant;
end architecture;

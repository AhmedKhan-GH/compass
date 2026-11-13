library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port (
        clk, reset, flush, in_valid : in std_logic;
        in_ready : out std_logic;
        in_data : in std_logic_vector(7 downto 0);
        out_valid : out std_logic;
        out_ready : in std_logic;
        out_data : out std_logic_vector(7 downto 0)
    );
end entity;

architecture rtl of top_module is
begin
    in_ready <= '0';
    out_valid <= '0';
    out_data <= (others => '0'); -- TODO: implement the one-word handshake buffer
end architecture;
